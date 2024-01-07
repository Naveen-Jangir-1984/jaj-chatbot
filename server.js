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

//JENKINS ------------------------------------------------------------
const jenkinsServer = process.env.JENKINS_SERVER;
const crumbIssuerApiUrl = `${jenkinsServer}/crumbIssuer/api/json`;
const jenkinsUsername = process.env.JENKINS_USERNAME;
const jenkinsApiToken = process.env.JENKINS_API_TOKEN;

app.post('/triggerjob', async (req, res) => {
  const jobName = req.body.jobname;
  const crumbResponse = await axios.get(crumbIssuerApiUrl, {
    auth: {
      username: jenkinsUsername,
      password: jenkinsApiToken,
    },
  });
  const crumb = crumbResponse.data.crumb;
  const crumbHeader = crumbResponse.data.crumbRequestField;

  await axios.post(`${jenkinsServer}/job/${jobName}/build`,
    {},
    {
      headers: {
        [crumbHeader]: crumb,
        Authorization: `Basic ${Buffer.from(`${jenkinsUsername}:${jenkinsApiToken}`).toString('base64')}`,
      },
    }
  );
  res.json({ msg: 'done' })
})

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
  res.json({ jobs: jobs })
})

app.post('/getbuilds', async (req, res) => {
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
  await axios.get(`${jenkinsServer}/job/${jobname}/api/json`,
    {},
    {
      headers: {
        [crumbHeader]: crumb,
        Authorization: `Basic ${Buffer.from(`${jenkinsUsername}:${jenkinsApiToken}`).toString('base64')}`,
      },
    }
  ).then(res => builds = res.data.builds);
  res.json({ builds: builds })
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

app.post('/createAzureIssue', async (req, res) => {
  const { project, issue } = req.body
  let data;

  await axios.post(
    `https://dev.azure.com/${azureDevOpsOrganization}/${project}/_apis/wit/workitems/$Issue?api-version=7.1`,
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

app.listen(port, () => {
  console.log(`server listening on port ${port}`)
})