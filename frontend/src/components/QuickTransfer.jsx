import React, { useState } from 'react';
import { bankingAPI } from '../utils/api';

function QuickTransfer() {
    const [recipient, setRecipient] = useState('');
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleTransfer = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        try {
            // Mock API call or real if implemented
            await new Promise(r => setTimeout(r, 1000));
            // await bankingAPI.transfer({ recipient, amount: parseFloat(amount) });

            setMessage('Transfer Successful! (Demo)');
            setRecipient('');
            setAmount('');
        } catch (err) {
            setMessage('Transfer failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="glass-card">
            <h3 style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>Quick Transfer</h3>

            <form onSubmit={handleTransfer}>
                <div className="form-group">
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Recipient Account / Email"
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <input
                        type="number"
                        className="input-field"
                        placeholder="Amount ($)"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                        min="1"
                    />
                </div>
                <button
                    type="submit"
                    className="btn-primary w-full"
                    disabled={loading}
                >
                    {loading ? 'Sending...' : 'Send Money'}
                </button>

                {message && (
                    <p style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: message.includes('Success') ? 'var(--success)' : 'var(--error)' }}>
                        {message}
                    </p>
                )}
            </form>
        </div>
    );
}

export default QuickTransfer;
