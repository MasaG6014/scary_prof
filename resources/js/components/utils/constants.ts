import * as openpgp from 'openpgp';

// Prime number used in cryptographic calculations
export const PRIME = 10007;

// Delay time in milliseconds for debug operations
export const DELAY = 200;

// Key generation options for OpenPGP
export const KEY_OPTIONS: openpgp.GenerateKeyOptions & { format: "armored" } = {
    type: 'rsa',               // Key type ('rsa' or 'ecc')
    rsaBits: 2048,             // Bit length for RSA keys
    userIDs: [{ name: 'anon', email: 'anon@anon.com' }],
    format: "armored"          // Output format
};