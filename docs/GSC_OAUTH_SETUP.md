# Google Search Console OAuth Setup

To enable the Google Search Console integration in this application, you must configure a Google Cloud Platform (GCP) project and supply the necessary OAuth credentials to the environment.

## 1. Create a GCP Project
1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project or select an existing one.

## 2. Enable APIs
1. In the sidebar, navigate to **APIs & Services > Library**.
2. Search for **Google Search Console API**.
3. Click **Enable**.

## 3. Configure the OAuth Consent Screen
1. Navigate to **APIs & Services > OAuth consent screen**.
2. Select **External** (or Internal if you are only using this within a Google Workspace).
3. Fill out the required App Information (App name, support email).
4. On the **Scopes** screen, click **Add or Remove Scopes**.
5. Add the `https://www.googleapis.com/auth/webmasters.readonly` scope. Note: This application only requires read-only access. Do not request full access.
6. Add your test users (if your app remains in Testing mode).

## 4. Create Credentials
1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials > OAuth client ID**.
3. Select **Web application** as the application type.
4. Name your OAuth client (e.g., "AI SEO Platform").
5. Under **Authorized redirect URIs**, add your backend callback URL. By default, this is:
   `http://localhost:3001/gsc/callback`
6. Click **Create**.

## 5. Add to Environment
Copy the generated Client ID and Client Secret, and add them to your root `.env` file:

```env
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3001/gsc/callback
```

## Security Notes
* **Secure Token Storage**: The application stores Access and Refresh tokens securely in PostgreSQL under the `Integration` table. 
* **Permission Errors**: If the user revokes permissions from their Google Account, the sync process will fail gracefully and prompt for re-authentication.
* **Rate Limits**: The GSC API enforces limits. The backend handles synchronization using a structured batch request limiting the row count.
