import { ReactNode, useState, useRef } from 'react';
import axios from 'axios';
import './app.css';

function App() {
  // variable types
  type ConversationType = {
    message: ReactNode,
    user: "user" | "system",
    keyword: string,
  }

  // application variables
  const applications = ["azure", "jenkins", "jira"]
  const [application, setApplication] = useState('')
  const [conversation, setConversation] = useState<ConversationType[]>([])
  const [text, setText] = useState('')
  // const [jenkins, setJenkins] = useState({
  //   job: "",
  //   jobs: [],
  //   build: [],
  //   builds: []
  // })
  const [azure, setAzure] = useState({
    projects: [],
    project: "",
    issue: {
      title: "",
      description: ""
    },
  })

  // applications functions
  const msg = useRef<any>(null);
  const scrollToBottom = () => {
    if (msg.current) {
      msg.current.scrollIntoView({ behaviour: "smooth" });
    }
  };

  // const trigger = async (job: string) => {
  //   if (application !== "jenkins") return
  //   await axios.post(`http://localhost:8000/triggerjob`, { jobname: job, })
  //     .then((res) => console.log(res.data.msg));
  // }

  // const getJobs = async () => {
  //   if (application !== "jenkins") return
  //   await axios.get(`http://localhost:8000/getjobs`)
  //     .then((res) => setJenkins({ ...jenkins, jobs: res.data.jobs }))
  // }

  // const getBuilds = async (jobname: string) => {
  //   if (application !== "jenkins") return
  //   await axios.post(`http://localhost:8000/getbuilds`, { jobname: jobname, })
  //     .then((res) => { setJenkins({ ...jenkins, builds: res.data.builds }) })
  // }

  // const createIssueInJira = async () => {
  //   if (application !== "jira") return
  //   const issue = {
  //     fields: {
  //       project: {
  //         key: "TEST"
  //       },
  //       summary: "login",
  //       description: "login with valid credentials",
  //       issuetype: {
  //         name: 'Story',
  //       },
  //     },
  //   };

  //   await axios.post(
  //     `http://localhost:8000/createJiraIssue`, { issue: issue })
  //     .then(res => console.log(res.data));
  // }

  const getAzureProjects = async () => {
    await axios.get(
      `http://localhost:8000/getAzureProjects`)
      .then(res => setAzure({
        ...azure, projects: res.data.data.value.map((pro: { name: string }) => pro.name)
      }))
  };

  const createIssueInAzure = async (title: string, desc: string) => {
    if (application !== "azure") return
    const issue = [
      {
        op: 'add',
        path: '/fields/System.Title',
        value: title,
      },
      {
        op: 'add',
        path: '/fields/System.Description',
        value: desc,
      },
      {
        op: 'add',
        path: '/fields/System.WorkItemType',
        value: 'Issue',
      },
    ];

    await axios.post(
      `http://localhost:8000/createAzureIssue`, { project: azure.project, issue: issue })
      .then(res => {
        setConversation([...conversation, {
          message: <div>{text}</div>,
          user: "user",
          keyword: "azure activity"
        },
        {
          message: <div>
            <div style={{ fontWeight: "bold" }}>Issue #{res.data.data.id} has been succesfully created!</div>
            <br></br>
            <div>{`which below activities you wish to perform in ${azure.project.toUpperCase()}?`}</div>
            <br></br>
            <div>{` - create an issue?`}</div>
          </div>,
          user: "system",
          keyword: "azure activity"
        }
        ])
        setAzure({ ...azure, issue: { title: "", description: "" } })
        setTimeout(() => scrollToBottom(), 1)
      });
  }

  // JSX code
  return (
    <div className="app">
      <div className="head">CHATBOT</div>
      {/* display messages */}
      <div className="display">
        <div className="messages">
          {conversation.map((c: { message: ReactNode, user: string }, i) =>
            <div className="message-wrapper">
              <div
                className="message"
                style={{
                  float: c.user === "system" ? "left" : "right",
                  backgroundColor: c.user === "system" ? "#ddd" : "#dde"
                }}
                key={i}>{c.message}
              </div>
            </div>
          )}
          <div ref={msg} />
        </div>
      </div>
      <div className="input">
        <div className="user-input">
          <div className="filters">
            {/* select application */}
            <select
              className="application"
              value={application}
              // application on change
              onChange={(e) => {
                const option = e.target.value
                if (option === application) return
                if (option === "") setAzure({
                  projects: [],
                  project: "",
                  issue: {
                    title: "",
                    description: ""
                  },
                })
                if (option === "azure") getAzureProjects()
                setApplication(option)
              }}>
              <option value="">application</option>
              {applications.map((app, i) =>
                <option key={i} value={app}>{app}</option>
              )}
            </select>
            {/* select projects */}
            {application === "azure" && azure.projects.length ? <select
              className="project"
              value={azure.project}
              // project on change
              onChange={(e) => {
                const option = e.target.value
                if (option === azure.project) return
                setAzure({ ...azure, project: option })
                if (option.length) {
                  switch (application) {
                    case "azure":
                      setConversation([...conversation, {
                        message: <div>
                          <div>{`which below activities you wish to perform in ${option.toUpperCase()}?`}</div>
                          <br></br>
                          <div>{` - create an issue?`}</div>
                        </div>,
                        user: "system",
                        keyword: "azure activity"
                      }])
                      break;
                    default:
                      break;
                  }
                }
              }}
            >
              <option value="">projects</option>
              {azure.projects.map((pro, i) => <option key={i} value={pro}>{pro}</option>)}
            </select> : ""}
            {/* <div className="dates">
              <label>FROM</label>
              <input type="date" disabled={application.length ? false : true} />
              <label>TO</label>
              <input type="date" disabled={application.length ? false : true} />
            </div> */}
          </div>
          <div className="user-control">
            {/* user input on console */}
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={application === "azure" && azure.project.length ? false : true}
            />
            {/* send button */}
            <button
              onClick={() => {
                if (application === "azure" &&
                  conversation[conversation.length - 1].user === "system" &&
                  conversation[conversation.length - 1].keyword === "azure activity" &&
                  text.includes("issue")) {
                  setConversation([...conversation,
                  { message: <div>{text}</div>, user: "user", keyword: "create issue" },
                  { message: <div>{`please provide an issue title`}</div>, user: "system", keyword: "issue title" }
                  ])
                }
                else if (application === "azure" &&
                  conversation[conversation.length - 1].user === "system" &&
                  conversation[conversation.length - 1].keyword === "issue title") {
                  setAzure({ ...azure, issue: { ...azure.issue, title: text } })
                  setConversation([...conversation,
                  { message: <div>{text}</div>, user: "user", keyword: "issue title" },
                  { message: <div>{`please enter issue description`}</div>, user: "system", keyword: "issue description" }
                  ])
                }
                else if (application === "azure" &&
                  conversation[conversation.length - 1].user === "system" &&
                  conversation[conversation.length - 1].keyword === "issue description") {
                  setAzure({ ...azure, issue: { ...azure.issue, description: text } })
                  createIssueInAzure(azure.issue.title, text)
                } else {
                  setConversation([...conversation,
                  { message: <div>{text}</div>, user: "user", keyword: "" },
                  {
                    message: <div>
                      <div>{`sorry, you will have to choose one of the option below in ${azure.project.toUpperCase()}`}</div>
                      <br></br>
                      <div>{` - create an issue?`}</div>
                    </div>,
                    user: "system",
                    keyword: "azure activity"
                  }])
                }
                setText("")
                setTimeout(() => scrollToBottom(), 1)
              }}
              disabled={application.length && text.length ? false : true}
            >Send</button>
          </div>
        </div>
      </div>
      <div className="foot">CHATBOT</div>
    </div>
  );
}

export default App;
