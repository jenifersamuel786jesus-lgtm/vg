(function () {
  const e = React.createElement;
  const { useEffect, useState } = React;

  function load(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch {
      return fallback;
    }
  }

  function save(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  function normalizeSkill(skill) {
    let s = (skill || "").trim().toLowerCase();
    s = s.replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ");
    if (s.length > 4 && s.endsWith("ing")) s = s.slice(0, -3);
    else if (s.length > 3 && s.endsWith("ed")) s = s.slice(0, -2);
    else if (s.length > 3 && s.endsWith("s")) s = s.slice(0, -1);
    return s;
  }

  function parseSkills(value) {
    return (value || "")
      .split(",")
      .map(normalizeSkill)
      .filter(Boolean);
  }

  function skillsOverlap(a, b) {
    return a.some((x) => b.some((y) => x === y || x.startsWith(y) || y.startsWith(x)));
  }

  function eventMatchesSkills(event, currentUser) {
    const vSkills = parseSkills(currentUser?.skills);
    const eSkills = parseSkills(event.skill);
    if (!vSkills.length || !eSkills.length) return true;
    return skillsOverlap(eSkills, vSkills);
  }

  function VolunteerApp() {
    const [volunteers, setVolunteers] = useState(load("volunteers", []));
    const [events, setEvents] = useState(load("events", []));
    const [currentUser, setCurrentUser] = useState(null);
    const [view, setView] = useState("home");
    const [modal, setModal] = useState(null);

    useEffect(() => save("volunteers", volunteers), [volunteers]);
    useEffect(() => save("events", events), [events]);

    function login(email, password) {
      const v = volunteers.find((x) => x.email === email && x.password === password);
      if (!v) {
        alert("Invalid login");
        return;
      }
      setCurrentUser(v);
      setView("dashboard-events");
    }

    function signup(data) {
      setVolunteers([
        ...volunteers,
        {
          name: data.name,
          email: data.email,
          skills: data.skills,
          password: data.password,
          photo: data.photo || "https://via.placeholder.com/100",
          badges: [],
        },
      ]);
      setView("login");
    }

    function applyEvent(index, motivation) {
      const next = [...events];
      next[index].volunteers.push({
        email: currentUser.email,
        status: "pending",
        motivation,
      });
      setEvents(next);
      setModal(null);
      setView("dashboard-events");
    }

    function downloadPDF(title) {
      const { jsPDF } = window.jspdf;
      const event = events.find((e) => e.title === title);
      const orgName = event ? event.orgName : "Organization";
      const date = new Date().toLocaleDateString();

      const pdf = new jsPDF("l", "mm", "a4");
      pdf.setFontSize(24);
      pdf.text("Certificate of Volunteering", 148, 40, { align: "center" });
      pdf.setLineWidth(2);
      pdf.rect(20, 20, 257, 170);
      pdf.setFontSize(16);
      pdf.text("This certifies that", 148, 70, { align: "center" });
      pdf.setFontSize(22);
      pdf.text(currentUser.name, 148, 95, { align: "center" });
      pdf.setFontSize(14);
      pdf.text("has successfully completed", 148, 120, { align: "center" });
      pdf.setFontSize(18);
      pdf.text(title, 148, 145, { align: "center" });
      pdf.setFontSize(12);
      pdf.text(`Organized by: ${orgName}`, 148, 165, { align: "center" });
      pdf.text(`Date: ${date}`, 148, 180, { align: "center" });
      pdf.line(100, 200, 196, 200);
      pdf.text("Signature", 148, 215, { align: "center" });
      pdf.save(title + "_Certificate.pdf");
    }

    function Home() {
      return e(
        "div",
        { className: "center card" },
        e("h1", null, "Volunteer & Grow"),
        e("p", null, "Volunteer with skills. Grow through impact."),
        e(
          "button",
          { onClick: () => setView("login") },
          "Volunteer"
        )
      );
    }

    function Login() {
      const [email, setEmail] = useState("");
      const [password, setPassword] = useState("");
      return e(
        "div",
        { className: "center card" },
        e("h2", null, "Volunteer Login"),
        e("input", {
          value: email,
          onChange: (ev) => setEmail(ev.target.value),
          placeholder: "Email",
        }),
        e("input", {
          value: password,
          onChange: (ev) => setPassword(ev.target.value),
          placeholder: "Password",
          type: "password",
        }),
        e(
          "button",
          { onClick: () => login(email, password) },
          "Login"
        ),
        e(
          "p",
          {
            style: { cursor: "pointer", color: "green" },
            onClick: () => setView("signup"),
          },
          "New user? Sign up"
        )
      );
    }

    function Signup() {
      const [name, setName] = useState("");
      const [email, setEmail] = useState("");
      const [skills, setSkills] = useState("");
      const [password, setPassword] = useState("");
      const [photo, setPhoto] = useState("");
      return e(
        "div",
        { className: "center card" },
        e("h2", null, "Volunteer Signup"),
        e("input", {
          value: name,
          onChange: (ev) => setName(ev.target.value),
          placeholder: "Name",
        }),
        e("input", {
          value: email,
          onChange: (ev) => setEmail(ev.target.value),
          placeholder: "Email",
        }),
        e("input", {
          value: skills,
          onChange: (ev) => setSkills(ev.target.value),
          placeholder: "Skills (comma-separated)",
        }),
        e("input", {
          value: password,
          onChange: (ev) => setPassword(ev.target.value),
          placeholder: "Password",
          type: "password",
        }),
        e("input", {
          value: photo,
          onChange: (ev) => setPhoto(ev.target.value),
          placeholder: "Profile Image URL",
        }),
        e(
          "button",
          { onClick: () => signup({ name, email, skills, password, photo }) },
          "Register"
        )
      );
    }

    function EventsView() {
      const rejected = events.filter((ev) =>
        ev.volunteers.some(
          (v) => v.email === currentUser.email && v.status === "rejected"
        )
      );
      const filtered = events
        .map((ev, i) => ({ ev, i }))
        .filter(({ ev }) => eventMatchesSkills(ev, currentUser));

      return e(
        "div",
        null,
        e(
          "div",
          { className: "card notice" },
          e("h3", null, "Notifications"),
          rejected.length
            ? rejected.map((ev, i) =>
                e("p", { key: i }, `Rejected: ${ev.title} (${ev.orgName})`)
              )
            : e("p", null, "No rejections.")
        ),
        e("h2", null, "Events"),
        filtered.length
          ? filtered.map(({ ev, i }) => {
              const myVol = ev.volunteers.find(
                (v) => v.email === currentUser.email
              );
              const status = myVol ? myVol.status : null;
              const applied = !!myVol;
              const full = ev.volunteers.length >= ev.maxVol;
              const label =
                status === "rejected"
                  ? "Rejected"
                  : status === "accepted"
                  ? "Accepted"
                  : status === "completed"
                  ? "Completed"
                  : applied
                  ? "Applied"
                  : "Apply";
              const disabled =
                full ||
                status === "pending" ||
                status === "rejected" ||
                status === "accepted" ||
                status === "completed";

              return e(
                "div",
                { className: "event", key: i },
                e("img", { src: ev.image, alt: ev.title }),
                e(
                  "div",
                  null,
                  e("h4", null, ev.title),
                  e("p", null, `Org: ${ev.orgName}`),
                  e("p", null, `${ev.volunteers.length}/${ev.maxVol} slots`),
                  e(
                    "button",
                    {
                      disabled,
                      onClick: () =>
                        setModal({
                          index: i,
                          motivation: "",
                        }),
                    },
                    label
                  )
                )
              );
            })
          : e(
              "div",
              { className: "card" },
              e("p", null, "No events match your skills yet.")
            )
      );
    }

    function CertificatesView() {
      const done = events.filter(
        (ev) =>
          ev.status === "Completed" &&
          ev.volunteers.some(
            (v) => v.email === currentUser.email && v.status === "completed"
          )
      );
      return e(
        "div",
        null,
        e("h2", null, "Certificates"),
        done.length
          ? done.map((ev, i) =>
              e(
                "div",
                { className: "card", key: i },
                e("h3", null, ev.title),
                e(
                  "button",
                  { onClick: () => downloadPDF(ev.title) },
                  "Download Certificate"
                )
              )
            )
          : "No certificates yet"
      );
    }

    function ProfileView() {
      const [name, setName] = useState(currentUser.name);
      const [skills, setSkills] = useState(currentUser.skills);
      const [photo, setPhoto] = useState(currentUser.photo);

      return e(
        "div",
        null,
        e("h2", null, "Edit Profile"),
        e("input", {
          value: name,
          onChange: (ev) => setName(ev.target.value),
        }),
        e("input", {
          value: skills,
          onChange: (ev) => setSkills(ev.target.value),
        }),
        e("input", {
          value: photo,
          onChange: (ev) => setPhoto(ev.target.value),
        }),
        e(
          "button",
          {
            onClick: () => {
              const updated = { ...currentUser, name, skills, photo };
              const next = volunteers.map((v) =>
                v.email === updated.email ? updated : v
              );
              setVolunteers(next);
              setCurrentUser(updated);
              setView("dashboard-profile");
            },
          },
          "Save"
        )
      );
    }

    function Dashboard() {
      return e(
        "div",
        { className: "layout" },
        e(
          "div",
          { className: "sidebar" },
          e("img", { src: currentUser.photo, alt: currentUser.name }),
          e("h3", null, currentUser.name),
          e("p", null, currentUser.skills),
          e(
            "div",
            null,
            e("h4", null, "Badges:"),
            currentUser.badges.length
              ? currentUser.badges.map((b, i) =>
                  e("span", { className: "badge", key: i }, b)
                )
              : "None yet"
          ),
          e(
            "button",
            { onClick: () => setView("dashboard-events") },
            "Events"
          ),
          e(
            "button",
            { onClick: () => setView("dashboard-cert") },
            "Certificates"
          ),
          e(
            "button",
            { onClick: () => setView("dashboard-profile") },
            "Edit Profile"
          ),
          e(
            "button",
            {
              onClick: () => {
                setCurrentUser(null);
                setView("home");
              },
            },
            "Logout"
          )
        ),
        e(
          "div",
          { className: "main" },
          view === "dashboard-events"
            ? e(EventsView)
            : view === "dashboard-cert"
            ? e(CertificatesView)
            : e(ProfileView)
        )
      );
    }

    return e(
      "div",
      null,
      view === "home"
        ? e(Home)
        : view === "login"
        ? e(Login)
        : view === "signup"
        ? e(Signup)
        : e(Dashboard),
      modal
        ? e(
            "div",
            {
              id: "applyModal",
              style: {
                position: "fixed",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                background: "rgba(0,0,0,0.5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 1000,
              },
            },
            e(
              "div",
              { className: "card", style: { maxWidth: "500px", width: "100%" } },
              e("h3", null, `Apply for ${events[modal.index].title}`),
              e("textarea", {
                rows: 5,
                value: modal.motivation,
                onChange: (ev) =>
                  setModal({ index: modal.index, motivation: ev.target.value }),
                placeholder: "Why do you want to volunteer for this event?",
              }),
              e(
                "button",
                {
                  onClick: () => {
                    if (!modal.motivation.trim()) {
                      alert("Please provide a motivation.");
                      return;
                    }
                    applyEvent(modal.index, modal.motivation);
                  },
                },
                "Submit Application"
              ),
              e(
                "button",
                { onClick: () => setModal(null) },
                "Cancel"
              )
            )
          )
        : null
    );
  }

  function renderVolunteerApp(rootId) {
    const root = ReactDOM.createRoot(document.getElementById(rootId));
    root.render(e(VolunteerApp));
    window.__volunteerRoot = root;
  }

  window.renderVolunteerApp = renderVolunteerApp;
})();
