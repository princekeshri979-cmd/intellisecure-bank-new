const fs = require('fs');
const path = require('path');

const loginPath = path.join(__dirname, 'src', 'pages', 'Login.jsx');
const content = fs.readFileSync(loginPath, 'utf8');

const captchaCode = `
                {/* Facial CAPTCHA Component */}
                {showCaptcha && (
                    <FacialCaptcha
                        onSuccess={() => {
                            setShowCaptcha(false);
                            navigate('/dashboard');
                        }}
                        onCancel={() => {
                            setShowCaptcha(false);
                            setUsername('');
                            setPassword('');
                            localStorage.clear();
                        }}
                    />
                )}
`;

// Find the line with "Don't have an account" and insert before it
const lines = content.split('\n');
const targetIndex = lines.findIndex(line => line.includes("Don't have an account"));

if (targetIndex !== -1) {
    // Insert the captcha code before "Don't have an account"
    lines.splice(targetIndex, 0, captchaCode);
    fs.writeFileSync(loginPath, lines.join('\n'), 'utf8');
    console.log('✓ Successfully added FacialCaptcha component to Login.jsx');
} else {
    console.log('✗ Could not find target location in Login.jsx');
}
