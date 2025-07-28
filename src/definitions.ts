export interface CowinCustomizedPluginPlugin {
  echo(options: { value: string }): Promise<{ value: string }>;
}
