const { DatabaseSync } = require('node:sqlite');
const path = require('path');

const dbPath = path.join(__dirname, 'bookings.db');
const db = new DatabaseSync(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    ref TEXT UNIQUE NOT NULL,
    service TEXT NOT NULL,
    price REAL NOT NULL,
    council TEXT NOT NULL,
    clinic TEXT NOT NULL,
    clinic_address TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    driver_phone TEXT NOT NULL,
    driver_email TEXT NOT NULL,
    licence_number TEXT,
    notes TEXT,
    payment_method TEXT DEFAULT 'Pay on Arrival',
    payment_status TEXT DEFAULT 'Pending',
    status TEXT DEFAULT 'Confirmed',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT NOT NULL,
    subject TEXT,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'New',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed sample bookings if table is empty
const countQuery = db.prepare("SELECT COUNT(*) as count FROM bookings");
const { count } = countQuery.get();

if (count === 0) {
  const insert = db.prepare(`
    INSERT INTO bookings (
      ref, service, price, council, clinic, clinic_address,
      date, time, driver_name, driver_phone, driver_email,
      licence_number, payment_method, payment_status, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now', ?))
  `);

  const sampleBookings = [
    ['DTM-84920', 'Taxi & Private Hire', 60, 'Wolverhampton City Council', 'Birmingham Edgbaston Clinic', '4 Buckthorn Avenue, Edgbaston B16 0QJ', '2026-10-15', '09:15 AM', 'Mohammed Tariq', '07700 900542', 'm.tariq@gmail.com', 'TARIQ8492019WM', 'Pay at Clinic', 'Pending', 'Confirmed', '-2 hours'],
    ['DTM-84921', 'Taxi & Private Hire', 60, 'Transport for London (TfL)', 'London Shepherds Bush Clinic', 'Goldhawk Road, Shepherds Bush W12 8HD', '2026-10-15', '11:00 AM', 'David Jenkins', '07700 900188', 'd.jenkins.cab@yahoo.co.uk', 'JENKI9102830LD', 'Paid Online', 'Paid', 'Confirmed', '-5 hours'],
    ['DTM-84922', 'HGV / LGV D4', 55, 'Manchester City Council', 'Manchester Salford Clinic', 'Worsley Brow, Manchester M28 2WN', '2026-10-15', '01:30 PM', 'Artur Kowalski', '07700 900412', 'artur.trans@outlook.com', 'KOWAL8810291MC', 'Pay at Clinic', 'Pending', 'Confirmed', '-12 hours'],
    ['DTM-84923', 'Taxi & Private Hire', 60, 'Leeds City Council', 'Leeds Central Clinic', 'Wellington Street, Leeds LS1 4LT', '2026-10-16', '10:30 AM', 'Gurpreet Singh', '07700 900823', 'gsingh.driver@gmail.com', 'SINGH7729104LS', 'Paid Online', 'Paid', 'Confirmed', '-1 day'],
    ['DTM-84924', 'PCV / Bus & Coach', 60, 'Liverpool City Council', 'Liverpool Knowsley Clinic', 'Britonwood Estate, Knowsley L33 7UT', '2026-10-16', '02:45 PM', 'Stephen O\'Connor', '07700 900331', 's.oconnor@btinternet.com', 'OCONN6619283LP', 'Pay at Clinic', 'Pending', 'Confirmed', '-1 day'],
    ['DTM-84925', 'Taxi & Private Hire', 60, 'Oldham Council', 'Oldham Sefton Clinic', 'Sefton Street, Oldham OL9 7LP', '2026-10-14', '04:00 PM', 'Rashid Mahmood', '07700 900774', 'rashid.privatehire@gmail.com', 'MAHMO9918234OL', 'Pay at Clinic', 'Paid', 'Completed', '-2 days'],
    ['DTM-84926', 'Express Urgent Fast-Track', 75, 'Wolverhampton City Council', 'Wolverhampton Central Clinic', 'Stafford Road, Wolverhampton WV10 6DH', '2026-10-14', '06:15 PM', 'James Wilson', '07700 900995', 'j.wilson99@hotmail.com', 'WILSO8472910WV', 'Paid Online', 'Paid', 'Completed', '-3 days']
  ];

  for (const b of sampleBookings) {
    insert.run(...b);
  }
}

module.exports = {
  db,
  createBooking: (data) => {
    const ref = 'DTM-' + Math.floor(10000 + Math.random() * 90000);
    const insert = db.prepare(`
      INSERT INTO bookings (
        ref, service, price, council, clinic, clinic_address,
        date, time, driver_name, driver_phone, driver_email,
        licence_number, notes, payment_method, payment_status, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Confirmed')
    `);
    insert.run(
      ref,
      data.service || 'Taxi & Private Hire',
      Number(data.price) || 60,
      data.council || 'Local Council',
      data.clinic || 'Nearest Clinic',
      data.clinic_address || '',
      data.date,
      data.time,
      data.driver_name,
      data.driver_phone,
      data.driver_email,
      data.licence_number || '',
      data.notes || '',
      data.payment_method || 'Pay at Clinic',
      data.payment_status || 'Pending'
    );
    const get = db.prepare("SELECT * FROM bookings WHERE ref = ?");
    return get.get(ref);
  },
  getBookings: (filter = {}) => {
    let sql = "SELECT * FROM bookings";
    const params = [];
    const clauses = [];
    if (filter.status && filter.status !== 'All') {
      clauses.push("status = ?");
      params.push(filter.status);
    }
    if (filter.search) {
      clauses.push("(driver_name LIKE ? OR driver_phone LIKE ? OR ref LIKE ? OR council LIKE ?)");
      const q = `%${filter.search}%`;
      params.push(q, q, q, q);
    }
    if (clauses.length > 0) {
      sql += " WHERE " + clauses.join(" AND ");
    }
    sql += " ORDER BY date DESC, time DESC";
    return db.prepare(sql).all(...params);
  },
  getBookingByRef: (ref) => {
    return db.prepare("SELECT * FROM bookings WHERE ref = ?").get(ref);
  },
  updateBookingStatus: (id, status) => {
    db.prepare("UPDATE bookings SET status = ? WHERE id = ?").run(status, Number(id));
    return db.prepare("SELECT * FROM bookings WHERE id = ?").get(Number(id));
  },
  getStats: () => {
    const total = db.prepare("SELECT COUNT(*) as count FROM bookings").get().count;
    const confirmed = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'Confirmed'").get().count;
    const completed = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE status = 'Completed'").get().count;
    const revenue = db.prepare("SELECT COALESCE(SUM(price), 0) as total FROM bookings WHERE status != 'Cancelled'").get().total;
    const today = db.prepare("SELECT COUNT(*) as count FROM bookings WHERE date = strftime('%Y-%m-%d', 'now')").get().count;
    return { total, confirmed, completed, revenue, today };
  },
  createInquiry: (data) => {
    const insert = db.prepare(`
      INSERT INTO inquiries (name, phone, email, subject, message)
      VALUES (?, ?, ?, ?, ?)
    `);
    insert.run(data.name, data.phone || '', data.email, data.subject || '', data.message);
    return { success: true };
  },
  getInquiries: () => {
    return db.prepare("SELECT * FROM inquiries ORDER BY created_at DESC").all();
  }
};
