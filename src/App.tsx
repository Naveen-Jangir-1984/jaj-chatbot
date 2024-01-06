import { useState } from 'react';
import axios from 'axios';
import './app.css';

function App() {
  // variable types
  type ConverstaionType = { message: string }

  // application variables
  const localServer = process.env.REACT_APP_LOCAL_SERVER;
  const applications = ["azure", "jenkins", "jira"]
  const [application, setApplication] = useState('')
  const [conversation, setConversation] = useState<ConverstaionType[]>([])
  const [text, setText] = useState('')
  const [jenkins, setJenkins] = useState({
    job: "",
    jobs: [],
    build: [],
    builds: []
  })
  const [jira, setJira] = useState({
    issue: {
      summary: "",
      description: ""
    },
  })

  // applications functions
  const trigger = async (job: string) => {
    if (application !== "jenkins") return
    await axios.post(`${localServer}/triggerjob`, { jobname: job, })
      .then((res) => console.log(res.data.msg));
  }

  const getJobs = async () => {
    if (application !== "jenkins") return
    await axios.get(`${localServer}/getjobs`)
      .then((res) => setJenkins({ ...jenkins, jobs: res.data.jobs }))
  }

  const getBuilds = async (jobname: string) => {
    if (application !== "jenkins") return
    await axios.post(`${localServer}/getbuilds`, { jobname: jobname, })
      .then((res) => { setJenkins({ ...jenkins, builds: res.data.builds }) })
  }

  const createIssueInJira = async () => {
    if (application !== "jira") return
    const issue = {
      fields: {
        project: {
          key: "TEST"
        },
        summary: "login",
        description: "login with valid credentials",
        issuetype: {
          name: 'Story',
        },
      },
    };

    await axios.post(
      `${localServer}/createJiraIssue`, { issue: issue })
      .then(res => console.log(res.data));
  }

  const createIssueInAzure = async () => {
    if (application !== "azure") return
    const issue = [
      {
        op: 'add',
        path: '/fields/System.Title',
        value: "Login",
      },
      {
        op: 'add',
        path: '/fields/System.Description',
        value: "Login with valid creds",
      },
      {
        op: 'add',
        path: '/fields/System.WorkItemType',
        value: 'Issue',
      },
    ];

    await axios.post(
      `${localServer}/createAzureIssue`, { issue: issue })
      .then(res => console.log(res.data));
  }

  // javascript + html code
  return (
    <div className="app">
      <div className="head">head</div>
      <div className="display">{conversation.map((c, i) =>
        <div className="message" key={i}>{c.message}</div>
      )}</div>
      <div className="input">
        <div className="user-input">
          <div className="applications">
            <select value={application} onChange={(e) => {
              const option = e.target.value
              setApplication(option)
              option.length && setConversation([...conversation, {
                message: `what activity you wish to perform in ${option.toUpperCase()} ?`
              }])
              switch (option) {
                default:
                  break;
              }
            }}>
              <option value="">select an application</option>
              {applications.map((app, i) =>
                <option key={i} value={app}>{app}</option>
              )}
            </select>
            <div className="dates">
              <label>FROM</label>
              <input type="date" disabled={application.length ? false : true} />
              <label>TO</label>
              <input type="date" disabled={application.length ? false : true} />
            </div>
          </div>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            disabled={application.length ? false : true}
          />
        </div>
        <button
          onClick={() => {
            text.length && setConversation([...conversation, { message: text }])
            text.length && setText("")
          }}
          disabled={application.length ? false : true}
        >Send</button>
      </div>
      <div className="foot">foot</div>
    </div>
  );
}

export default App;
