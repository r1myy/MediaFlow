/**
 * Contract every media import source must implement. New sources (direct
 * upload, a user's own cloud drive, an RSS feed the user owns, etc.) are
 * added by implementing this interface and registering in `registry.ts` —
 * no other part of the app changes.
 *
 * All sources operate strictly on content the requesting user owns or has
 * explicit rights to import; there is no adapter for scraping third-party
 * streaming platforms.
 */
export interface MediaSourceAdapter {
  /** Unique, stable key stored on the `Media.sourceType` column. */
  readonly id: string;
  readonly label: string;

  /** Whether this adapter can handle the given import request payload. */
  supports(input: MediaImportInput): boolean;

  /** Validate the input and return normalized metadata without importing. */
  probe(input: MediaImportInput): Promise<MediaProbeResult>;

  /** Perform the import, streaming bytes into object storage. */
  import(input: MediaImportInput): Promise<MediaImportResult>;
}

export type MediaImportInput =
  | { kind: "upload"; fileName: string; mimeType: string; sizeBytes: number }
  | {
      kind: "cloud-import";
      provider: "google-drive" | "dropbox";
      fileId: string;
      accessToken: string;
    };

export interface MediaProbeResult {
  title: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
}

export interface MediaImportResult {
  storageKey: string;
  sizeBytes: number;
  checksum: string;
}
