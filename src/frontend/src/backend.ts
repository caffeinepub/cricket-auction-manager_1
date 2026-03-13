// Stub backend — this app is fully offline (localStorage only).
// Platform hooks (config.ts, useActor.ts) require these exports.

export interface backendInterface {
  [key: string]: unknown;
}

export interface CreateActorOptions {
  // biome-ignore lint: platform requirement
agentOptions?: Record<string, unknown>;
  agent?: unknown;
  processError?: (e: unknown) => never;
}

type UploadFile = (blob: ExternalBlob) => Promise<Uint8Array>;
type DownloadFile = (bytes: Uint8Array) => Promise<ExternalBlob>;

export class ExternalBlob {
  private _url?: string;
  private _bytes?: Uint8Array;
  public onProgress?: (progress: number) => void;

  constructor(bytes: Uint8Array) {
    this._bytes = bytes;
  }

  static fromURL(url: string): ExternalBlob {
    const b = new ExternalBlob(new Uint8Array());
    b._url = url;
    return b;
  }

  async getBytes(): Promise<Uint8Array> {
    if (this._bytes) return this._bytes;
    if (this._url) {
      const res = await fetch(this._url);
      return new Uint8Array(await res.arrayBuffer());
    }
    return new Uint8Array();
  }

  getURL(): string | undefined {
    return this._url;
  }
}

export function createActor(
  _canisterId: string,
  _uploadFile?: UploadFile,
  _downloadFile?: DownloadFile,
  _options?: CreateActorOptions,
): backendInterface {
  return {};
}
