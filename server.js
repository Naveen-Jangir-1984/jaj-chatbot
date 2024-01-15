require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const app = express();
const port = 8000;

app.use(cors())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//AZURE --------------------------------------------------------------
const azureDevOpsOrganization = process.env.AZURE_DEVOPS_ORGANIZATION;
const azureDevOpsPersonalAccessToken = process.env.AZURE_DEVOPS_API_TOKEN

app.get('/getAzureProjects', async (req, res) => {
  let data;
  await axios.get(`https://dev.azure.com/${azureDevOpsOrganization}/_apis/projects?api-version=7.1`, {
    headers: {
      Authorization: `Basic ${btoa(`:${azureDevOpsPersonalAccessToken}`)}`,
    },
  }).then(res => data = res.data);
  res.json({ data })
})
app.post('/getAzureProjectReleases', async (req, res) => {
  const project = req.body.project
  let data;
  try {
    await axios.get(`https://dev.azure.com/${azureDevOpsOrganization}/${project}/_apis/release/releases?api-version=6.0-preview.8`, {
      headers: {
        Authorization: `Basic ${btoa(`:${azureDevOpsPersonalAccessToken}`)}`,
      },
    }).then(res => data = { status: true, releases: res.data.value });
  } catch (error) {
    console.log(error)
    data = { status: false, releases: [] }
  }
  res.json({ data })
})
app.post('/createAzureIssue', async (req, res) => {
  const { project, issue } = req.body
  let data;

  await axios.post(
    `https://dev.azure.com/${azureDevOpsOrganization}/${project}/_apis/wit/workitems/$${issue[2].value}?api-version=7.1`,
    issue,
    {
      headers: {
        'Content-Type': 'application/json-patch+json',
        Authorization: `Basic ${btoa(`:${azureDevOpsPersonalAccessToken}`)}`,
      },
    }
  ).then(res => data = res.data);
  res.json({ data: data })
})

//JENKINS ------------------------------------------------------------
const jenkinsServer = process.env.JENKINS_SERVER;
const crumbIssuerApiUrl = `${jenkinsServer}/crumbIssuer/api/json`;
const jenkinsUsername = process.env.JENKINS_USERNAME;
const jenkinsApiToken = process.env.JENKINS_API_TOKEN;

app.get('/getjobs', async (req, res) => {
  const crumbResponse = await axios.get(crumbIssuerApiUrl, {
    auth: {
      username: jenkinsUsername,
      password: jenkinsApiToken,
    },
  });
  const crumb = crumbResponse.data.crumb;
  const crumbHeader = crumbResponse.data.crumbRequestField;
  let jobs;
  await axios.get(`${jenkinsServer}/api/json`,
    {},
    {
      headers: {
        [crumbHeader]: crumb,
        Authorization: `Basic ${Buffer.from(`${jenkinsUsername}:${jenkinsApiToken}`).toString('base64')}`,
      },
    }
  ).then(res => jobs = res.data.jobs);
  res.json({ jobs })
})
app.post('/getjobbuilds', async (req, res) => {
  const jobname = req.body.jobname
  const crumbResponse = await axios.get(crumbIssuerApiUrl, {
    auth: {
      username: jenkinsUsername,
      password: jenkinsApiToken,
    },
  });
  const crumb = crumbResponse.data.crumb;
  const crumbHeader = crumbResponse.data.crumbRequestField;
  let builds;
  await axios.get(`${jenkinsServer}/job/${jobname}/api/json?tree=builds[number,timestamp,result,duration]`,
    {},
    {
      headers: {
        [crumbHeader]: crumb,
        Authorization: `Basic ${Buffer.from(`${jenkinsUsername}:${jenkinsApiToken}`).toString('base64')}`,
      },
    }
  ).then(res => builds = res.data.builds);
  res.json({ builds })
})
app.post('/getlastbuild', async (req, res) => {
  const jobname = req.body.jobname
  const crumbResponse = await axios.get(crumbIssuerApiUrl, {
    auth: {
      username: jenkinsUsername,
      password: jenkinsApiToken,
    },
  });
  const crumb = crumbResponse.data.crumb;
  const crumbHeader = crumbResponse.data.crumbRequestField;
  let build;
  await axios.get(`${jenkinsServer}/job/${jobname}/lastBuild/api/json`,
    {},
    {
      headers: {
        [crumbHeader]: crumb,
        Authorization: `Basic ${Buffer.from(`${jenkinsUsername}:${jenkinsApiToken}`).toString('base64')}`,
      },
    }
  ).then(res => build = res.data);
  res.json({ build })
})
app.post('/buildjob', async (req, res) => {
  const jobname = req.body.jobname;
  const crumbResponse = await axios.get(crumbIssuerApiUrl, {
    auth: {
      username: jenkinsUsername,
      password: jenkinsApiToken,
    },
  });
  const crumb = crumbResponse.data.crumb;
  const crumbHeader = crumbResponse.data.crumbRequestField;

  await axios.post(`${jenkinsServer}/job/${jobname}/build`,
    {},
    {
      headers: {
        [crumbHeader]: crumb,
        Authorization: `Basic ${Buffer.from(`${jenkinsUsername}:${jenkinsApiToken}`).toString('base64')}`,
      },
    }
  );
  res.json({ data: "success" })
})

//JIRA ---------------------------------------------------------------
const jiraURL = process.env.JIRA_URL;
const jiraEmail = process.env.JIRA_EMAIL;
const jiraAPIToken = process.env.JIRA_API_TOKEN

app.get('/getJiraProjects', async (req, res) => {
  const jiraCredentials = `${jiraEmail}:${jiraAPIToken}`
  const base64Credentials = btoa(jiraCredentials);
  let data;

  await axios.get(
    `${jiraURL}/rest/api/2/project`,
    {
      headers: {
        Authorization: `Basic ${base64Credentials}`,
      },
    }
  ).then(res => data = res.data);
  res.json({ data })
})

app.post('/createJiraIssue', async (req, res) => {
  const issue = req.body.issue
  const jiraCredentials = `${jiraEmail}:${jiraAPIToken}`
  const base64Credentials = btoa(jiraCredentials);
  let data;

  await axios.post(
    `${jiraURL}/rest/api/2/issue`,
    issue,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${base64Credentials}`,
      },
    }
  ).then(res => data = res.data);
  res.json({ data: data })
})

// port running info
app.listen(port, () => {
  console.log(`server listening on port ${port}`)
})