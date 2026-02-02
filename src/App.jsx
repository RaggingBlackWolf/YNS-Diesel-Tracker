import { useState } from "react";
import "./App.css";

const COMPANY_LOGO = "/logo.png";

const ADMIN_USER = "admin";
const ADMIN_PASS = "yns123";
const MAX_CONSUMPTION = 40;

const trucks = [
  "MG54WRGP",
  "MG54NBGP",
  "JGF718MP",
  "JPG018MP",
  "JM24XRGP",
  "JR79HMGP",
  "JN84VZGP",
];

const drivers = [
  "Bhekithemba Themba Ncube",
  "Sibusiso Celimpilo Mahlambi",
  "Sakhile Adonacious Mdakane",
  "Nhlalo Shange",
  "Samuel Zwelibanzi Nhlabathi",
  "Thapelo Mbetse",
  "Xolani A Mthethwa",
];

export default function App() {
  const today = new Date().toISOString().split("T")[0];

  const [loggedIn, setLoggedIn] = useState(false);
  const [role, setRole] = useState("user");
  const [login, setLogin] = useState({ user: "", pass: "" });

  const [orders, setOrders] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [report, setReport] = useState("");

  const [form, setForm] = useState({
    truck: "",
    driver: "",
    odometer: "",
    litres: "",
    supplier: "",
    date: today,
    cost: "",
  });

  /* ---------------- LOGIN ---------------- */

  const handleLogin = () => {
    if (role === "admin") {
      if (login.user === ADMIN_USER && login.pass === ADMIN_PASS) {
        setLoggedIn(true);
      } else {
        alert("Invalid admin login");
      }
    } else {
      if (login.user.trim() !== "") {
        setLoggedIn(true);
      } else {
        alert("Enter your name");
      }
    }
  };

  const logout = () => {
    setLoggedIn(false);
    setLogin({ user: "", pass: "" });
    setRole("user");
  };

  /* ---------------- FORM ---------------- */

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const addOrder = () => {
    if (!form.truck || !form.driver || !form.litres || !form.odometer) {
      alert("Fill all required fields");
      return;
    }

    const newOrders = [...orders, { id: Date.now(), ...form }];
    setOrders(newOrders);
    checkAlerts(newOrders);

    setForm({
      truck: "",
      driver: "",
      odometer: "",
      litres: "",
      supplier: "",
      date: today,
      cost: "",
    });
  };

  /* ---------------- ALERTS ---------------- */

  const checkAlerts = (data) => {
    const byTruck = {};

    data.forEach((o) => {
      if (!byTruck[o.truck]) byTruck[o.truck] = [];
      byTruck[o.truck].push(o);
    });

    const warnings = [];

    Object.keys(byTruck).forEach((truck) => {
      const list = byTruck[truck].sort(
        (a, b) => new Date(a.date) - new Date(b.date)
      );

      for (let i = 1; i < list.length; i++) {
        const prev = list[i - 1];
        const curr = list[i];

        const km = curr.odometer - prev.odometer;
        const litres = curr.litres;

        if (km > 0) {
          const per100 = (litres / km) * 100;

          if (per100 > MAX_CONSUMPTION) {
            warnings.push(
              `🚨 ${truck}: ${per100.toFixed(2)} L/100km (${prev.date} → ${
                curr.date
              })`
            );
          }
        }
      }
    });

    setAlerts(warnings);
  };

  /* ---------------- REPORTS ---------------- */

  const generateWeekly = () => {
    const now = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(now.getDate() - 7);

    const data = orders.filter((o) => new Date(o.date) >= weekAgo);
    buildReport(data, "Weekly");
  };

  const generateMonthly = () => {
    const now = new Date();

    const data = orders.filter((o) => {
      const d = new Date(o.date);
      return (
        d.getMonth() === now.getMonth() &&
        d.getFullYear() === now.getFullYear()
      );
    });

    buildReport(data, "Monthly");
  };

  const buildReport = (data, type) => {
    if (data.length === 0) {
      setReport("No data");
      return;
    }

    const totalLitres = data.reduce((s, o) => s + Number(o.litres), 0);
    const totalCost = data.reduce((s, o) => s + Number(o.cost || 0), 0);

    let text = `${type} Report\n\n`;
    text += `Total Litres: ${totalLitres} L\n`;
    text += `Total Cost: R ${totalCost.toFixed(2)}\n\n`;

    setReport(text);
  };

  /* ---------------- UI ---------------- */

  if (!loggedIn) {
    return (
      <div className="login">
        <img src={COMPANY_LOGO} width="120" />
        <h2>YNS Diesel Login</h2>

        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          <option value="user">Driver</option>
          <option value="admin">Admin</option>
        </select>

        <input
          placeholder={role === "admin" ? "Username" : "Name"}
          value={login.user}
          onChange={(e) =>
            setLogin({ ...login, user: e.target.value })
          }
        />

        {role === "admin" && (
          <input
            type="password"
            placeholder="Password"
            value={login.pass}
            onChange={(e) =>
              setLogin({ ...login, pass: e.target.value })
            }
          />
        )}

        <button onClick={handleLogin}>Login</button>
      </div>
    );
  }

  return (
    <div className="app">
      <h1>🚛 Diesel Tracker</h1>

      <button onClick={logout}>Logout</button>

      {alerts.length > 0 && (
        <div className="alerts">
          {alerts.map((a, i) => (
            <p key={i}>{a}</p>
          ))}
        </div>
      )}

      <div className="form">
        <select name="truck" value={form.truck} onChange={handleChange}>
          <option value="">Truck</option>
          {trucks.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>

        <select name="driver" value={form.driver} onChange={handleChange}>
          <option value="">Driver</option>
          {drivers.map((d) => (
            <option key={d}>{d}</option>
          ))}
        </select>

        <input
          name="odometer"
          placeholder="Odometer"
          value={form.odometer}
          onChange={handleChange}
        />

        <input
          name="litres"
          placeholder="Litres"
          value={form.litres}
          onChange={handleChange}
        />

        <input
          name="cost"
          placeholder="Cost"
          value={form.cost}
          onChange={handleChange}
        />

        <button onClick={addOrder}>Add</button>
      </div>

      <div className="reports">
        {role === "admin" && (
          <>
            <button onClick={generateWeekly}>Weekly</button>
            <button onClick={generateMonthly}>Monthly</button>
          </>
        )}

        <pre>{report}</pre>
      </div>

      <table>
        <thead>
          <tr>
            <th>Truck</th>
            <th>Driver</th>
            <th>KM</th>
            <th>Litres</th>
            <th>Cost</th>
            <th>Date</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>{o.truck}</td>
              <td>{o.driver}</td>
              <td>{o.odometer}</td>
              <td>{o.litres}</td>
              <td>{o.cost}</td>
              <td>{o.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
