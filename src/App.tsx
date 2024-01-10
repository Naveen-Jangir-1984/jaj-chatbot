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

  // application state variables
  const applications = ["azure", "jenkins", "jira"]
  const [application, setApplication] = useState('')
  const [project, setProject] = useState('')
  const [conversation, setConversation] = useState<ConversationType[]>([])
  const [text, setText] = useState('')
  const [azure, setAzure] = useState({
    projects: [],
    project: "",
    issue: { title: "", description: "", type: "" }
  })
  const [jenkins, setJenkins] = useState({
    jobs: [],
    job: "",
    builds: [],
    build: "",
  })
  const [jira, setJira] = useState({
    projects: [],
    project: "",
    issue: { title: "", description: "", type: "" }
  })

  // common methods
  const msg = useRef<any>(null);
  const scrollToBottom = () => {
    if (msg.current) {
      msg.current.scrollIntoView({ behaviour: "smooth" });
    }
  };

  // handle azure related methods
  const getAzureProjects = async () => {
    await axios.get(
      `http://localhost:8000/getAzureProjects`)
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
  const createIssueInAzure = async () => {
    if (application !== "azure") return
    const issue = [
      {
        op: 'add',
        path: '/fields/System.Title',
        value: azure.issue.title,
      },
      {
        op: 'add',
        path: '/fields/System.Description',
        value: azure.issue.description,
      },
      {
        op: 'add',
        path: '/fields/System.WorkItemType',
        value: azure.issue.type
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
            <div><b>
              <span
                className="workitem"
                style={{
                  backgroundColor: azure.issue.type === "User Story" ?
                    "#90EE90" : azure.issue.type === "Bug" ?
                      "#FF7276" : azure.issue.type === "Task" ?
                        "#FFBF00" : "#ADD8E6"
                }}
              >{azure.issue.type} #{res.data.data.id}</span> has been succesfully created!</b>
            </div>
            <br></br>
            <div>which below activity you wish to perform on <b>{azure.project.toUpperCase()}</b> project?</div>
            <br></br>
            <div>{` - create an issue?`}</div>
          </div>,
          user: "system",
          keyword: "azure activity"
        }
        ]), 1000)
        setAzure({
          ...azure, issue: { title: "", description: "", type: "" }
        })
        setTimeout(() => scrollToBottom(), 1500)
      });
  }

  // handle azure related methods
  const getJenkinsJobs = async () => {
    await axios.get(`http://localhost:8000/getjobs`)
      // .then(res => console.log(res.data.jobs))
      .then(res => setJenkins({
        ...jenkins, jobs: res.data.jobs.map((pro: { name: string }) => pro.name)
      })
      )
  }
  const buildJenkinsJob = async () => {
    let beforeBuild: any;
    await axios.post(`http://localhost:8000/getlastbuild`, { jobname: jenkins.job, })
      .then(res => beforeBuild = res.data.build)
    await axios.post(`http://localhost:8000/buildjob`, { jobname: jenkins.job, })
      .then(res => setConversation([...conversation, {
        message: <div>{text}</div>,
        user: "user",
        keyword: "jenkins activity"
      }, {
        message: <div>{res.data.data === "success" ? "build is in progress, please wait..." : "unable to build !"}</div>,
        user: "system",
        keyword: "jenkins activity"
      }]))
    await new Promise(resolve => setTimeout(resolve, 10000));
    let afterBuild: any;
    await axios.post(`http://localhost:8000/getlastbuild`, { jobname: jenkins.job, })
      .then(res => afterBuild = res.data.build)

    if (beforeBuild.number < afterBuild.number) {
      setTimeout(() => setConversation([...conversation, {
        message: <div>{text}</div>,
        user: "user",
        keyword: "jenkins activity"
      },
      {
        message: <div>
          <div><b>
            <span>build #{afterBuild.id} has been succesfully created </span>
            <span>{afterBuild.result === "SUCCESS" ? " and " : " but "}</span>
            <span>{afterBuild.result === "SUCCESS" ?
              <span style={{ backgroundColor: "lightgreen", padding: "2px 5px", borderRadius: "5px" }}>completed</span> :
              <span style={{ backgroundColor: "lightcoral", padding: "2px 5px", borderRadius: "5px" }}>failed</span>}</span> !</b>
          </div>
          <br></br>
          <div>which below activity you wish to perform on <b>{jenkins.job.toUpperCase()}</b> project?</div>
          <br></br>
          <div>{` - build?`}</div>
        </div>,
        user: "system",
        keyword: "jenkins activity"
      }
      ]), 1000)
      setTimeout(() => scrollToBottom(), 1500)
    }
  }

  // handle jira related methods
  const getJiraProjects = async () => {
    await axios.get(
      `http://localhost:8000/getJiraProjects`)
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
  const createIssueInJira = async () => {
    const pro: { id: string, name: string }[] = jira.projects.filter((p: { name: string }) => p.name === jira.project)
    const issue = {
      fields: {
        project: {
          key: pro[0].id
        },
        summary: jira.issue.title,
        description: jira.issue.description,
        issuetype: {
          name: jira.issue.type,
        },
      },
    };

    await axios.post(
      `http://localhost:8000/createJiraIssue`, { issue: issue })
      // .then(res => console.log(res.data));
      .then(res => {
        setTimeout(() => setConversation([...conversation, {
          message: <div>{text}</div>,
          user: "user",
          keyword: "jira activity"
        },
        {
          message: <div>
            <div><b>
              <span
                className="workitem"
                style={{
                  backgroundColor: azure.issue.type === "User Story" ?
                    "#90EE90" : azure.issue.type === "Bug" ?
                      "#FF7276" : azure.issue.type === "Task" ?
                        "#FFBF00" : "#ADD8E6"
                }}
              >{jira.issue.type} #{res.data.data.id}</span> has been succesfully created!</b></div>
            <br></br>
            <div>which below activity you wish to perform on <b>{jira.project.toUpperCase()}</b> project?</div>
            <br></br>
            <div>{` - create an issue?`}</div>
          </div>,
          user: "system",
          keyword: "jira activity"
        }
        ]), 1000)
        setJira({ ...jira, issue: { title: "", description: "", type: "" } })
        setTimeout(() => scrollToBottom(), 1500)
      });
  }

  // handle application selection
  const handleApplicationSelection = (e: ChangeEvent<HTMLSelectElement>) => {
    const option = e.target.value
    if (option === application) return
    if (option === "") {
      setProject("")
      setAzure({
        projects: [], project: "", issue: {
          title: "", description: "", type: ""
        }
      })
      setJenkins({ jobs: [], job: "", builds: [], build: "" })
      setJira({ projects: [], project: "", issue: { title: "", description: "", type: "" } })
    }
    setApplication(option)
    switch (option) {
      case "azure":
        setJira({ projects: [], project: "", issue: { title: "", description: "", type: "" } })
        setJenkins({ jobs: [], job: "", builds: [], build: "" })
        getAzureProjects()
        break;
      case "jenkins":
        setAzure({ projects: [], project: "", issue: { title: "", description: "", type: "" } })
        setJira({ projects: [], project: "", issue: { title: "", description: "", type: "" } })
        getJenkinsJobs()
        break;
      case "jira":
        setAzure({ projects: [], project: "", issue: { title: "", description: "", type: "" } })
        setJenkins({ jobs: [], job: "", builds: [], build: "" })
        getJiraProjects()
        break;
    }
  }

  // handle project selection
  const handleProjectSelection = (e: ChangeEvent<HTMLSelectElement>) => {
    const option = e.target.value
    setProject(option)
    if (!option.length) {
      setAzure({ ...azure, project: "" })
      setJenkins({ ...jenkins, job: "" })
      setJira({ ...jira, project: "" })
    }
    if (option === azure.project || option === jenkins.job || option === jira.project ||
      !option.length) return
    if (application === "azure") {
      setAzure({ ...azure, project: option })
    } else if (application === "jenkins") {
      setJenkins({ ...jenkins, job: option })
    } else if (application === "jira") {
      setJira({ ...jira, project: option })
    }
    if (application === "azure") {
      setConversation([...conversation, {
        message: <div>
          <div>which below activity you wish to perform on <b>{option.toUpperCase()}</b> project?</div>
          <br></br>
          <div>{` - create an issue?`}</div>
        </div>,
        user: "system",
        keyword: "azure activity"
      }])
    } else if (application === "jenkins") {
      setConversation([...conversation, {
        message: <div>
          <div>which below activity you wish to perform on <b>{option.toUpperCase()}</b> job?</div>
          <br></br>
          <div>{` - build?`}</div>
        </div>,
        user: "system",
        keyword: "jenkins activity"
      }])
    } else if (application === "jira") {
      setConversation([...conversation, {
        message: <div>
          <div>which below activity you wish to perform on <b>{option.toUpperCase()}</b> project?</div>
          <br></br>
          <div>{` - create an issue?`}</div>
        </div>,
        user: "system",
        keyword: "jira activity"
      }])
    }
    setTimeout(() => scrollToBottom(), 1)
  }

  // handle user input
  const handleUserInput = (e: ChangeEvent<HTMLInputElement>) => {
    setText(e.target.value)
  }

  // handle send button click
  const handleSendClick = () => {
    setTimeout(() => scrollToBottom(), 1)

    // handle azure related conversations
    if (application === "azure" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "azure activity" &&
      text.includes("issue")) {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure issue" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure issue" },
      { message: <div>{`please provide an issue title`}</div>, user: "system", keyword: "azure issue title" }
      ]), 1000)
    } else if (application === "azure" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "azure issue title") {
      setAzure({ ...azure, issue: { ...azure.issue, title: text } })
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure issue title" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure issue title" },
      { message: <div>{`please enter issue description`}</div>, user: "system", keyword: "azure issue description" }
      ]), 1000)
    } else if (application === "azure" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "azure issue description") {
      setAzure({ ...azure, issue: { ...azure.issue, description: text } })
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure issue description" }
      ])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure issue description" },
      {
        message: <div>
          <div>please confirm on the issue type?</div>
          <br></br>
          <div> - epic</div>
          <div> - story</div>
          <div> - bug</div>
          <div> - task</div>
        </div>,
        user: "system",
        keyword: "azure issue type"
      },]), 1000)
    } else if (application === "azure" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "azure issue type" &&
      (text.toLowerCase().includes("epic") || text.toLowerCase().includes("story") || text.toLowerCase().includes("bug") || text.toLowerCase().includes("task"))) {
      const issuetype = text.toLowerCase().includes("epic") && !text.toLowerCase().includes("story") && !text.toLowerCase().includes("bug") && !text.toLowerCase().includes("task") ?
        "Epic" : text.toLowerCase().includes("story") && !text.toLowerCase().includes("bug") && !text.toLowerCase().includes("task") ?
          "User Story" : text.toLowerCase().includes("bug") && !text.toLowerCase().includes("task") ?
            "Bug" : "Task"
      setAzure({ ...azure, issue: { ...azure.issue, type: issuetype } })
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure issue type" }
      ])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure issue type" },
      {
        message: <div>
          <div>please confirm to create an issue?</div>
          <br></br>
          <div> - yes / no</div>
        </div>,
        user: "system",
        keyword: "azure issue confirmation"
      },]), 1000)
    } else if (application === "azure" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "azure issue confirmation" &&
      text.toLowerCase().includes("yes")) {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure issue confirmation" },])
      createIssueInAzure()
    } else if (application === "azure" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "azure issue confirmation" &&
      text.toLowerCase().includes("no")) {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure activity" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure activity" },
      {
        message: <div>
          <div>ok let us start over again, please chose one of the option below on <b>{azure.project.toUpperCase()}</b> project?</div>
          <br></br>
          <div>{` - create an issue?`}</div>
        </div>,
        user: "system",
        keyword: "azure activity"
      }]), 1000)
    } else if (application === "azure") {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure activity" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "azure activity" },
      {
        message: <div>
          <div><span className="sorry">sorry</span>  you can choose ONLY one of the option below on <b>{azure.project.toUpperCase()}</b> project?</div>
          <br></br>
          <div>{` - create an issue?`}</div>
        </div>,
        user: "system",
        keyword: "azure activity"
      }]), 1000)
    }

    // handle jira related converstaions
    else if (application === "jira" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "jira activity" &&
      text.includes("issue")) {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira issue" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira issue" },
      { message: <div>{`please provide an issue title`}</div>, user: "system", keyword: "jira issue title" }
      ]), 1000)
    } else if (application === "jira" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "jira issue title") {
      setJira({ ...jira, issue: { ...jira.issue, title: text } })
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira issue title" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira issue title" },
      { message: <div>{`please enter issue description`}</div>, user: "system", keyword: "jira issue description" }
      ]), 1000)
    } else if (application === "jira" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "jira issue description") {
      setJira({ ...jira, issue: { ...jira.issue, description: text } })
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira issue description" }
      ])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira issue description" },
      {
        message: <div>
          <div>please confirm on the issue type?</div>
          <br></br>
          <div> - epic</div>
          <div> - story</div>
          <div> - bug</div>
        </div>,
        user: "system",
        keyword: "jira issue type"
      },]), 1000)
    } else if (application === "jira" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "jira issue type" &&
      (text.toLowerCase().includes("epic") || text.toLowerCase().includes("story") || text.toLowerCase().includes("bug"))) {
      const issuetype = text.toLowerCase().includes("epic") && !text.toLowerCase().includes("story") && !text.toLowerCase().includes("bug") ?
        "Epic" : text.toLowerCase().includes("story") && !text.toLowerCase().includes("bug") ?
          "Story" : "Bug"
      setJira({ ...jira, issue: { ...jira.issue, type: issuetype } })
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira issue type" }
      ])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira issue type" },
      {
        message: <div>
          <div>please confirm to create an issue?</div>
          <br></br>
          <div> - yes / no</div>
        </div>,
        user: "system",
        keyword: "jira issue confirmation"
      },]), 1000)
    } else if (application === "jira" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "jira issue confirmation" &&
      text.toLowerCase().includes("yes")) {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira issue confirmation" },])
      createIssueInJira()
    } else if (application === "jira" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "jira issue confirmation" &&
      text.toLowerCase().includes("no")) {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira activity" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira activity" },
      {
        message: <div>
          <div>ok let us start over again, please chose one of the option below on <b>{jira.project.toUpperCase()}</b> project?</div>
          <br></br>
          <div>{` - create an issue?`}</div>
        </div>,
        user: "system",
        keyword: "jira activity"
      }]), 1000)
    } else if (application === "jira") {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira activity" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "jira activity" },
      {
        message: <div>
          <div><span className="sorry">sorry</span>  you can choose ONLY one of the option below on <b>{jira.project.toUpperCase()}</b> project?</div>
          <br></br>
          <div>{` - create an issue?`}</div>
        </div>,
        user: "system",
        keyword: "jira activity"
      }]), 1000)
    }

    // handle jenkins related converstaions
    else if (application === "jenkins" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "jenkins activity" &&
      text.includes("build")) {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "build" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "build" },
      {
        message: <div>
          <div>please confirm on build?</div>
          <br></br>
          <div> - yes / no</div>
        </div>, user: "system", keyword: "jenkins build confirmation"
      }
      ]), 1000)
    } else if (application === "jenkins" &&
      conversation[conversation.length - 1].user === "system" &&
      conversation[conversation.length - 1].keyword === "jenkins build confirmation" &&
      text.toLowerCase().includes("yes")) {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "" },])
      buildJenkinsJob()
    } else if (application === "jenkins") {
      setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "" },])
      setTimeout(() => setConversation([...conversation,
      { message: <div>{text}</div>, user: "user", keyword: "" },
      {
        message: <div>
          <div><span className="sorry">sorry</span>  you can choose ONLY one of the option below on <b>{jenkins.job.toUpperCase()}</b> job?</div>
          <br></br>
          <div>{` - build?`}</div>
        </div>,
        user: "system",
        keyword: "jenkins activity"
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
        <div className="messages"
          style={{
            justifyContent: conversation.length ? "" : "center",
            alignItems: conversation.length ? "" : "center",
          }}>
          {conversation.length ? conversation.map((c: { message: ReactNode, user: string }, i) =>
            <div className="message-wrapper" key={i}>
              <div
                className="message"
                style={{
                  float: c.user === "system" ? "left" : "right",
                  backgroundColor: c.user === "system" ? "#fff" : "#ccc"
                }}
              >{c.message}
              </div>
            </div>
          ) : <h4>please select an application followed by project/job to interact with chatbot</h4>}
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
              <option value="">-- application --</option>
              {applications.map((app, i) =>
                <option key={i} value={app}>{app}</option>
              )}
            </select>
            {/* select azure/jenkins/jira projects */}
            {(application === "azure" && azure.projects.length) ||
              (application === "jenkins" && jenkins.jobs.length) ||
              (application === "jira" && jira.projects.length) ? <select
                className={jenkins.jobs.length ? "jobs" : "projects"}
                value={project}
                onChange={(e) => handleProjectSelection(e)}
              >
              <option value="">{jenkins.jobs.length ? "-- job --" : "-- project --"}</option>
              {azure.projects.length ?
                azure.projects.map((pro: { id: string, name: string }, i) =>
                  <option key={i} value={pro.name}>{pro.name}</option>) :
                jenkins.jobs.length ?
                  jenkins.jobs.map((name, i) =>
                    <option key={i} value={name}>{name}</option>) :
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
              onChange={(e) => handleUserInput(e)}
              disabled={azure.project.length || jenkins.job || jira.project.length ?
                false : true}
            />
            {/* send button */}
            <button
              onClick={() => handleSendClick()}
              disabled={(azure.project.length || jenkins.job || jira.project.length) &&
                text.length ? false : true}
            >Send</button>
          </div>
        </div>
      </div>
      <div className="foot">FOOTER</div>
    </div>
  );
}

export default App;
