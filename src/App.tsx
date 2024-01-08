import { ReactNode, useState, useRef, ChangeEvent } from 'react';
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
  const [project, setProject] = useState('')
  const [conversation, setConversation] = useState<ConversationType[]>([])
  const [text, setText] = useState('')
  const [jira, setJira] = useState({
    projects: [],
    project: "",
  })
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

  const getJiraProjects = async () => {
    await axios.get(
      `http://localhost:8000/getJiraProjects`)
      // .then(res => console.log(res.data.data))
      .then(res => setJira({
        ...jira, projects: res.data.data.map((pro: { key: string, name: string }) => {
          return {
            id: pro.key,
            name: pro.name
          }
        })
      })
      )
  };

  const getAzureProjects = async () => {
    await axios.get(
      `http://localhost:8000/getAzureProjects`)
      // .then(res => console.log(res.data.data))
      .then(res => setAzure({
        ...azure, projects: res.data.data.value.map((pro: { id: string, name: string }) => {
          return {
            id: pro.id,
            name: pro.name
          }
        })
      })
      )
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
        setTimeout(() => setConversation([...conversation, {
          message: <div>{text}</div>,
          user: "user",
          keyword: "azure activity"
        },
        {
          message: <div>
            <div><b>Issue #{res.data.data.id} has been succesfully created!</b></div>
            <br></br>
            <div>{`which below activities you wish to perform in ${azure.project.toUpperCase()}?`}</div>
            <br></br>
            <div>{` - create an issue?`}</div>
          </div>,
          user: "system",
          keyword: "azure activity"
        }
        ]), 1000)
        setAzure({ ...azure, issue: { title: "", description: "" } })
        setTimeout(() => scrollToBottom(), 1500)
      });
  }

  // handle application selection
  const handleApplicationSelection = (e: ChangeEvent<HTMLSelectElement>) => {
    const option = e.target.value
    if (option === application) return
    if (option === "") {
      setAzure({
        projects: [],
        project: "",
        issue: {
          title: "",
          description: ""
        },
      })
      setJira({
        projects: [],
        project: "",
      })
    }
    if (option === "azure") {
      setJira({ projects: [], project: "" })
      getAzureProjects()
    }
    if (option === "jira") {
      setAzure({ projects: [], project: "", issue: { title: "", description: "" } })
      getJiraProjects()
    }
    setApplication(option)
  }

  // handle project selection
  const handleProjectSelection = (e: ChangeEvent<HTMLSelectElement>) => {
    const option = e.target.value
    setProject(option)
    if (option === azure.project || option === jira.project || !option.length) return
    if (application === "azure") {
      setAzure({ ...azure, project: option })
    } else if (application === "jira") {
      setJira({ ...jira, project: option })
    }
    if (application === "azure") {
      setConversation([...conversation, {
        message: <div>
          <div>which below activities you wish to perform in <b>{option.toUpperCase()}</b></div>
          <br></br>
          <div>{` - create an issue?`}</div>
        </div>,
        user: "system",
        keyword: "azure activity"
      }])
    } else if (application === "jira") {
      setConversation([...conversation, {
        message: <div>
          <div>which below activities you wish to perform in <b>{option.toUpperCase()}</b></div>
          <br></br>
          <div>{` - create an issue?`}</div>
        </div>,
        user: "system",
        keyword: "jira activity"
      }])
    }
    setTimeout(() => scrollToBottom(), 1)
  }

  // handle send click
  const handleSendClick = () => {
    setTimeout(() => scrollToBottom(), 1)
    if (application === "azure" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "azure activity" &&
      text.includes("issue")) {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "create issue" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "create issue" },
      { message: <div>{`please provide an issue title`}</div>, user: "system", keyword: "issue title" }
      ]), 1000)
    }
    else if (application === "azure" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "issue title") {
      setAzure({ ...azure, issue: { ...azure.issue, title: text } })
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "issue title" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "issue title" },
      { message: <div>{`please enter issue description`}</div>, user: "system", keyword: "issue description" }
      ]), 1000)
    }
    else if (application === "azure" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "issue description") {
      setAzure({ ...azure, issue: { ...azure.issue, description: text } })
      setConversation([...conversation, {
        message: <div>{text}</div>,
        user: "user",
        keyword: "azure activity"
      },])
      createIssueInAzure(azure.issue.title, text)
    } else if (application === "azure") {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "" },
      {
        message: <div>
          <div>sorry, you will have to choose one of the option below in <b>{azure.project.toUpperCase()}</b></div>
          <br></br>
          <div>{` - create an issue?`}</div>
        </div>,
        user: "system",
        keyword: "azure activity"
      }]), 1000)
    }
    setText("")
    setTimeout(() => scrollToBottom(), 1500)
  }

  // JSX code
  return (
    <div className="app">
      <div className="head">HEADER</div>
      {/* display messages */}
      <div className="display">
        <div className="messages">
          {conversation.map((c: { message: ReactNode, user: string }, i) =>
            <div className="message-wrapper" key={i}>
              <div
                className="message"
                style={{
                  float: c.user === "system" ? "left" : "right",
                  backgroundColor: c.user === "system" ? "#def" : "#ddd"
                }}
              >{c.message}
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
              onChange={(e) => handleApplicationSelection(e)}>
              <option value="">application</option>
              {applications.map((app, i) =>
                <option key={i} value={app}>{app}</option>
              )}
            </select>
            {/* select projects */}
            {(application === "azure" && azure.projects.length) ||
              (application === "jira" && jira.projects.length) ? <select
                className="project"
                value={project}
                onChange={(e) => handleProjectSelection(e)}
              >
              <option value="">projects</option>
              {azure.projects.length ?
                azure.projects.map((pro: { id: string, name: string }, i) =>
                  <option key={i} value={pro.name}>{pro.name}</option>) :
                jira.projects.length ?
                  jira.projects.map((pro: { id: string, name: string }, i) =>
                    <option key={i} value={pro.name}>{pro.name}</option>) :
                  ""
              }
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
              disabled={azure.project.length || jira.project.length ?
                false : true}
            />
            {/* send button */}
            <button
              onClick={() => handleSendClick()}
              disabled={(azure.project.length || jira.project.length) && text.length ? false : true}
            >Send</button>
          </div>
        </div>
      </div>
      <div className="foot">FOOTER</div>
    </div>
  );
}

export default App;
