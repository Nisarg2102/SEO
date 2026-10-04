const fs = require('fs');

const path = 'apps/web/src/app/(dashboard)/settings/page.tsx';
let page = fs.readFileSync(path, 'utf8');

// Ensure we have correct imports
if (!page.includes('import Link from "next/link";')) {
  page = "import Link from 'next/link';\n" + page;
}

// Add integration state
if (!page.includes('const [integrations, setIntegrations]')) {
  page = page.replace(
    /const \[savingWs, setSavingWs\] = React.useState\(false\);\n  const \[savedWs, setSavedWs\] = React.useState\(false\);/,
    `const [savingWs, setSavingWs] = React.useState(false);\n  const [savedWs, setSavedWs] = React.useState(false);\n  const [integrations, setIntegrations] = React.useState<WorkspaceIntegrations | null>(null);\n  const [loadingIntegrations, setLoadingIntegrations] = React.useState(true);\n  const [togglingPostiz, setTogglingPostiz] = React.useState(false);`
  );
}

// Fetch integrations in useEffect
page = page.replace(
  /workspacesApi\n      \.getBrandProfile\(activeWorkspace\.id\)/,
  `workspacesApi.getIntegrations(activeWorkspace.id)
      .then(setIntegrations)
      .catch(console.error)
      .finally(() => setLoadingIntegrations(false));
    
    workspacesApi
      .getBrandProfile(activeWorkspace.id)`
);

// Add toggle Postiz function
page = page.replace(
  /async function handleSaveWorkspace/,
  `async function handleTogglePostiz(connect: boolean) {
    if (!activeWorkspace) return;
    setTogglingPostiz(true);
    try {
      await workspacesApi.togglePostiz(activeWorkspace.id, connect);
      const updated = await workspacesApi.getIntegrations(activeWorkspace.id);
      setIntegrations(updated);
    } catch {
      alert('Failed to configure Postiz. Check if server configuration exists.');
    } finally {
      setTogglingPostiz(false);
    }
  }

  async function handleSaveWorkspace`
);

// Replace Integrations UI
page = page.replace(/<CardHeader>\s*<CardTitle>Integrations<\/CardTitle>[\s\S]*?<\/Card>\s*<\/div>/,
`<CardHeader>
          <CardTitle>Integrations</CardTitle>
          <CardDescription>Connect external platforms. Integrations are configured via environment variables.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loadingIntegrations ? (
            <p className="text-gray-500">Loading integrations...</p>
          ) : (
            <>
              {/* Google Search Console */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium">Google Search Console</p>
                  <p className="text-sm text-gray-500">Import SEO performance data</p>
                  
                  <div className="mt-2 text-sm">
                    {!integrations?.gsc.serverConfigured ? (
                      <div className="text-amber-700">
                        <span className="font-medium">Status: Admin configuration required</span>
                        <p className="mt-1 text-xs">Google Search Console OAuth has not been configured by the application administrator.</p>
                      </div>
                    ) : integrations?.gsc.connected ? (
                      <div>
                        <span className="text-green-700 font-medium">Status: Connected</span>
                        {integrations.gsc.propertyUrl && (
                          <p className="text-xs text-gray-600 mt-1">Property: {integrations.gsc.propertyUrl}</p>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-600 font-medium">Status: Not Connected</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!integrations?.gsc.serverConfigured ? (
                    <Button variant="outline" disabled>Requires Admin Setup</Button>
                  ) : integrations?.gsc.connected ? (
                    <Link href={\`/workspaces/\${activeWorkspace.id}/search-console\`}>
                      <Button variant="outline">Manage Connection</Button>
                    </Link>
                  ) : (
                    <Link href={\`/workspaces/\${activeWorkspace.id}/search-console\`}>
                      <Button variant="default">Connect GSC</Button>
                    </Link>
                  )}
                </div>
              </div>

              {/* Postiz */}
              <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <p className="font-medium">Postiz (Social Publishing)</p>
                  <p className="text-sm text-gray-500">Publish content to social platforms</p>

                  <div className="mt-2 text-sm">
                    {!integrations?.postiz.serverConfigured ? (
                      <div className="text-amber-700">
                        <span className="font-medium">Status: Admin configuration required</span>
                        <p className="mt-1 text-xs">Postiz integration URL/Key has not been configured by the application administrator.</p>
                      </div>
                    ) : integrations?.postiz.connected ? (
                      <span className="text-green-700 font-medium">Status: Connected</span>
                    ) : (
                      <span className="text-gray-600 font-medium">Status: Available</span>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  {!integrations?.postiz.serverConfigured ? (
                    <Button variant="outline" disabled>Requires Admin Setup</Button>
                  ) : integrations?.postiz.connected ? (
                    <Button variant="outline" disabled={togglingPostiz} onClick={() => handleTogglePostiz(false)}>Disconnect</Button>
                  ) : (
                    <Button variant="default" disabled={togglingPostiz} onClick={() => handleTogglePostiz(true)}>Connect Postiz</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>`
);

fs.writeFileSync(path, page);
console.log('Patched Settings page');
