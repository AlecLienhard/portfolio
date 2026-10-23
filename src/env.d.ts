interface ImportMetaEnv {
  /** Git commit SHA, injected as a Docker build arg in CI. */
  readonly PUBLIC_BUILD_SHA?: string;
  /** Build date (YYYY-MM-DD), injected in CI. */
  readonly PUBLIC_BUILD_DATE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
