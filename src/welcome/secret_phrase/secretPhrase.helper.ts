import { Logger } from '@util/Logger.util';
import * as bip from 'bip39';
import { Buffer } from 'buffer';

export class SecretPhraseHelper {
    static generateMnemonic() {
        try {
            window.Buffer = Buffer;
            const mnemonic = bip.generateMnemonic();
            return mnemonic.split(' ');
        } catch (error) {
            Logger.error(error)
            throw 'Failed to generate mnemonic';
        }
    }
}