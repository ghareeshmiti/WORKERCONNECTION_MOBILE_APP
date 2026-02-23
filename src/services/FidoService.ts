import { NativeModules } from 'react-native';

const { Fido2Nfc } = NativeModules;

// For local debugging with ADB reverse
// const BASE_URL = 'http://localhost:3000';
// const BASE_URL = 'http://192.168.2.102:3000';
const BASE_URL = 'https://workerconnection-backend.vercel.app';
const API_URL = `${BASE_URL.replace(/\/$/, '')}/api`;

const handleResponse = async (res: Response) => {
    const text = await res.text();
    console.log(`FidoService Response [${res.status}]:`, text);

    try {
        const data = JSON.parse(text);
        if (!res.ok) {
            throw new Error(data.error || data.details || `Request failed: ${res.status}`);
        }
        return data;
    } catch (e) {
        if (!res.ok) {
            throw new Error(`Server Error (${res.status}): ${text.substring(0, 100)}...`);
        }
        throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
    }
};

export const authenticateUser = async (username: string, action: string | null = null, location: string = 'Unknown') => {
    try {
        // 1. Begin Login - get challenge and credential IDs from server
        console.log('FidoService: Calling loginBegin...');
        const serverOptions = await loginBegin(username);
        console.log('FidoService: loginBegin success.');

        let fidoOptions = serverOptions;
        if (serverOptions.publicKey) {
            fidoOptions = serverOptions.publicKey;
        }

        if (fidoOptions.allowCredentials?.length) {
            console.log(`FidoService: allowCredentials has ${fidoOptions.allowCredentials.length} entries.`);
        }

        // 2. Authenticate using Google Play Services FIDO2 API (supports NFC security keys)
        console.log('FidoService: Calling Fido2Nfc.authenticate...');
        const authRespStr = await Fido2Nfc.authenticate(JSON.stringify(fidoOptions));
        const authResp = JSON.parse(authRespStr);
        console.log('FidoService: FIDO2 authentication success. ID:', authResp.id);

        // 3. Finish Login - send assertion to server for verification
        console.log('FidoService: Calling loginFinish...');
        const result = await loginFinish(username, authResp, action, location);
        console.log('FidoService: loginFinish success.');
        return result;
    } catch (e) {
        console.error('FidoService Error:', e);
        throw e;
    }
};

export const authenticateUserWithPin = async (username: string, pin: string, action: string | null = null, location: string = 'Unknown') => {
    try {
        console.log('FidoService: Starting PIN-based auth...');
        const serverOptions = await loginBegin(username);
        let fidoOptions = serverOptions;
        if (serverOptions.publicKey) {
            fidoOptions = serverOptions.publicKey;
        }
        console.log('FidoService: Calling Fido2Nfc.authenticateWithPin...');
        const authRespStr = await Fido2Nfc.authenticateWithPin(JSON.stringify(fidoOptions), pin);
        const authResp = JSON.parse(authRespStr);
        console.log('FidoService: PIN auth success.');
        const result = await loginFinish(username, authResp, action, location);
        console.log('FidoService: PIN loginFinish success.');
        return result;
    } catch (e) {
        console.error('FidoService PIN Error:', e);
        throw e;
    }
};

export const loginBegin = async (username: string = '') => {
    const res = await fetch(`${API_URL}/login/begin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
    });
    return handleResponse(res);
};

export const loginFinish = async (username: string, body: any, action: string | null, location: string) => {
    const res = await fetch(`${API_URL}/login/finish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, body, action, location }),
    });
    return handleResponse(res);
};

export const nfcLogin = async (uidHex: string, action: string | null = null, location: string | null = null) => {
    const res = await fetch(`${API_URL}/auth/nfc-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uidHex, action, location }),
    });
    const data = await handleResponse(res);
    // Server returns { session, user }
    // User metadata contains worker_id
    const workerId = data.worker?.worker_id || data.user?.user_metadata?.worker_id;
    return {
        verified: true,
        username: workerId,
        worker: data.worker,
        session: data.session,
        status: data.status,
        message: data.message
    };
};