"""
Banking API Endpoints

Handles account operations with risk-based authorization.
"""

from fastapi import APIRouter, Depends, HTTPException, status, Header
from motor.motor_asyncio import AsyncIOMotorDatabase
from typing import Optional, List
from datetime import datetime
import secrets

from ..core.database import get_database
from ..core.security import decode_token
from ..core.config import settings
from ..api.models import (
    AccountBalanceResponse, Transaction, PaymentRequest, PaymentResponse
)

router = APIRouter(prefix="/api/banking", tags=["Banking"])


async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Get current authenticated user and session"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication"
        )
    
    token = authorization.split(" ")[1]
    payload = decode_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    
    user_id = payload.get("sub")
    session_id = payload.get("session_id")
    
    # Convert string IDs to ObjectId for MongoDB query
    from bson import ObjectId
    try:
        user_object_id = ObjectId(user_id)
        session_object_id = ObjectId(session_id) if session_id else None
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid ID"
        )
    
    user = await db.users.find_one({"_id": user_object_id})
    session = await db.sessions.find_one({"_id": session_object_id}) if session_object_id else None
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    # Check if session is locked
    if session and session.get("is_locked"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Session locked. Complete facial CAPTCHA to continue."
        )
    
    return {"user": user, "session": session}


@router.get("/balance", response_model=AccountBalanceResponse)
async def get_balance(
    current: dict = Depends(get_current_user)
):
    """Get account balance"""
    user = current["user"]
    
    return AccountBalanceResponse(
        account_no=user.get("account_no", ""),
        balance=user.get("balance", 0.0),
        currency="USD"
    )


@router.get("/transactions", response_model=List[Transaction])
async def get_transactions(
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database),
    limit: int = 20
):
    """Get transaction history"""
    user = current["user"]
    user_id = str(user["_id"])
    
    # Fetch transactions
    transactions_cursor = db.transactions.find(
        {"user_id": user_id}
    ).sort("timestamp", -1).limit(limit)
    
    transactions = await transactions_cursor.to_list(length=limit)
    
    return [
        Transaction(
            transaction_id=str(tx["_id"]),
            type=tx.get("type", "DEBIT"),
            amount=tx.get("amount", 0.0),
            description=tx.get("description", ""),
            timestamp=tx.get("timestamp"),
            balance_after=tx.get("balance_after", 0.0)
        )
        for tx in transactions
    ]


@router.post("/payment", response_model=PaymentResponse)
async def create_payment(
    payment: PaymentRequest,
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """
    Create payment/transfer
    Requires low threat score - blocked if threat >= threshold
    """
    user = current["user"]
    session = current["session"]
    user_id = str(user["_id"])
    
    # Check threat score
    threat_score = session.get("threat_score", 0) if session else 0
    
    # High-value transactions require facial CAPTCHA
    if payment.amount > 500 or threat_score >= 40:
        if session and session.get("requires_facial_captcha"):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please complete facial CAPTCHA before making transactions"
            )
    
    # Block if threat too high
    if threat_score >= settings.THREAT_LOCK_THRESHOLD:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Transaction blocked due to security concerns"
        )
    
    # Check sufficient balance
    current_balance = user.get("balance", 0.0)
    if current_balance < payment.amount:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insufficient balance"
        )
    
    # Process payment
    new_balance = current_balance - payment.amount
    
    # Update user balance
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"balance": new_balance}}
    )
    
    # Create transaction record
    transaction_id = f"TXN{secrets.token_hex(8).upper()}"
    
    transaction_doc = {
        "user_id": user_id,
        "transaction_id": transaction_id,
        "type": "DEBIT",
        "amount": payment.amount,
        "recipient_account": payment.recipient_account,
        "description": payment.description,
        "timestamp": datetime.utcnow(),
        "balance_after": new_balance,
        "threat_score_at_time": threat_score
    }
    
    await db.transactions.insert_one(transaction_doc)
    
    return PaymentResponse(
        success=True,
        transaction_id=transaction_id,
        message="Payment successful",
        new_balance=new_balance
    )


@router.post("/account/lock")
async def lock_account(
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Lock account (user-initiated)"""
    user = current["user"]
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_locked": True}}
    )
    
    return {"message": "Account locked successfully"}


@router.post("/account/unlock")
async def unlock_account(
    current: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(get_database)
):
    """Unlock account (requires facial CAPTCHA in production)"""
    user = current["user"]
    session = current["session"]
    
    # In production, require facial CAPTCHA verification first
    # For demo, check if CAPTCHA was completed recently
    if session and session.get("requires_facial_captcha"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Complete facial CAPTCHA first"
        )
    
    await db.users.update_one(
        {"_id": user["_id"]},
        {"$set": {"is_locked": False}}
    )
    
    return {"message": "Account unlocked successfully"}
