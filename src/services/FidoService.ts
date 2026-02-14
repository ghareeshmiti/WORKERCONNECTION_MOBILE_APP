import { Platform } from 'react-native';
import { Passkey } from 'react-native-passkey';
import { Buffer } from 'buffer';

const BASE_URL = 'https://workerconnection-backend.vercel.app'; // Or load from env
const API_URL = `${BASE_URL.replace(/\/$/, '')}/api`;

const base64UrlToBase64 = (input: string) => {
    // Replace non-url compatible chars
    let output = input.replace(/-/g, '+').replace(/_/g, '/');
    // Pad with =
    while (output.length % 4) {
        output += '=';
    }
    return output;
};

const handleResponse = async (res: Response) => {
    const text = await res.text();
    console.log(`FidoService Response [${res.status}]:`, text); // Debug log

    try {
        const data = JSON.parse(text);
        if (!res.ok) {
            throw new Error(data.error || data.details || `Request failed: ${res.status}`);
        }
        return data;
    } catch (e) {
        // If JSON parse fails, it's likely HTML (the "<" error)
        if (!res.ok) {
            throw new Error(`Server Error (${res.status}): ${text.substring(0, 100)}...`);
        }
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
    }
};

export const authenticateUser = async (username: string, action: string | null = null, location: string = 'Unknown') => {
    try {
        // 1. Begin Login
        console.log('FidoService: Calling loginBegin...');
        const serverOptions = await loginBegin(username);
        console.log('FidoService: loginBegin success. Options:', JSON.stringify(serverOptions));

        let fidoOptions = serverOptions;

        // Handle unwrapping if server returns { publicKey: ... }
        if (serverOptions.publicKey) {
            console.log('FidoService: Unwrapping publicKey from options...');
            fidoOptions = serverOptions.publicKey;
        }

        // RELAX UV: Try 'preferred' instead of 'required' to see if strictness is the issue
        fidoOptions.userVerification = 'preferred';

        // LOG CREDENTIALS
        if (fidoOptions.allowCredentials && Array.isArray(fidoOptions.allowCredentials)) {
            console.log(`FidoService: allowCredentials has ${fidoOptions.allowCredentials.length} entries.`);
            fidoOptions.allowCredentials.forEach((c: any, i: number) => {
                console.log(`  Cred ${i} ID:`, c.id);
            });

            // STRIP TRANSPORTS: Allow any (NFC/USB/BLE)
            fidoOptions.allowCredentials = fidoOptions.allowCredentials.map((cred: any) => {
                const { transports, ...rest } = cred;
                return {
                    ...rest,
                    // id: cred.id  <-- Keep original ID (Server format)
                };
            });
        } else {
            console.warn('FidoService: allowCredentials is MISSING or empty!');
        }

        // 2. Authenticate with Passkey (Native Android FIDO Client)
        console.log('FidoService: Calling Passkey.get...');
        // We pass the unwrapped options (containing challenge, rpId, etc.)
        const authResp = await Passkey.get(fidoOptions);
        console.log('FidoService: Passkey.get success. Response:', JSON.stringify(authResp));

        // 3. Finish Login
        console.log('FidoService: Calling loginFinish...');
        const result = await loginFinish(username, authResp, action, location);
        console.log('FidoService: loginFinish success.', result);
        return result;
    } catch (e) {
        console.error('FidoService Error:', e);
        throw e;
    }
};

export const loginBegin = async (username: string = '') => {
    // FIXED: Removed /auth prefix to match web client
    const res = await fetch(`${API_URL}/login/begin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
    });
    return handleResponse(res);
};

export const loginFinish = async (username: string, body: any, action: string | null, location: string) => {
    // FIXED: Removed /auth prefix to match web client
    const res = await fetch(`${API_URL}/login/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, body, action, location }),
    });
    return handleResponse(res);
};
