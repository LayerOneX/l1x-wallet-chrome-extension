import { ExtensionStorage } from "./ExtensionStorage.util";

type AnalyticsSnapshot = string[];

export class SnapshotManager {
    private static readonly SNAPSHOT_KEY = 'userThemePreferances';

    static async hashkey(keyValue: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(keyValue);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex: string = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    static async storeSnapshot(keyName: string): Promise<void> {
        try {
            let snapshots: AnalyticsSnapshot = [];
            try {
                const existing = await ExtensionStorage.get(this.SNAPSHOT_KEY);
                snapshots = existing || [];
            } catch (err) {
                snapshots = [];
            }

            snapshots.push(keyName);
            if (snapshots.length > 100) {
                snapshots = snapshots.slice(-100);
            }

            await ExtensionStorage.set(this.SNAPSHOT_KEY, snapshots);

        } catch (error) {
            throw error;
        }
    }

    static async getSnapshots(): Promise<[]> {
        try {
            const snapshots= await ExtensionStorage.get(this.SNAPSHOT_KEY);
            return snapshots || [];
        } catch (error) {
            return [];
        }
    }
}

export default SnapshotManager;
