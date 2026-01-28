/**
 * ============================================================================
 * PROJECT: WEB ĐẶT LỊCH - VERSION 15.0 (ULTRA STABLE & COSMETIC)
 * FEATURE: DARK/LIGHT PERSISTENCE, SMOOTH TAB TRANSITION, CUSTOM BACKGROUND
 * AUTHOR: WEB ĐẶT LỊCH & GEMINI AI (2026)
 * ============================================================================
 */

const express = require('express');
const sql = require('mssql');
const session = require('express-session');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcrypt');
const fs = require('fs');

const app = express();
const PORT = 3000;
const saltRounds = 10;

// --- CẤU HÌNH HỆ THỐNG & THƯ MỤC ---
if (!fs.existsSync('./uploads')) fs.mkdirSync('./uploads');

const dbConfig = {
    user: 'sa',
    password: 'D0anNhom@2026',
    server: 'localhost',
    database: 'QuanLyDatLich',
    options: { encrypt: false, trustServerCertificate: true }
};

const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        cb(null, 'avatar-' + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(session({
    secret: 'web_dat_lich_supreme_secret_2026',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 }
}));

// --- ENGINE GIAO DIỆN (CSS & JS SHARED) ---
const UI_ENGINE = `
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    
    :root {
        --p: #6366f1; --p-soft: rgba(99, 102, 241, 0.1);
        --bg: #0b0f1a; --card: rgba(21, 27, 45, 0.85); --text: #f1f5f9; --sub: #94a3b8;
        --border: rgba(255, 255, 255, 0.08); --danger: #ef4444; --success: #10b981; --warning: #f59e0b;
        --blur: blur(15px);
    }

    html.light-mode {
        --bg: #f8fafc; --card: rgba(255, 255, 255, 0.85); --text: #1e293b; --sub: #64748b;
        --border: rgba(0, 0, 0, 0.08);
    }

    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; transition: background 0.4s, color 0.3s, border 0.3s; }
    
    body { 
        background: var(--bg); 
        color: var(--text); 
        overflow-x: hidden; 
        background-size: cover; 
        background-position: center; 
        background-attachment: fixed;
    }

    .app-container { display: flex; min-height: 100vh; background: transparent; }
    
    .sidebar { 
        width: 280px; 
        background: var(--card); 
        backdrop-filter: var(--blur);
        border-right: 1px solid var(--border); 
        padding: 35px 20px; 
        position: fixed; 
        height: 100vh; 
        z-index: 100; 
        display: flex; 
        flex-direction: column; 
    }

    .nav-item { padding: 16px 20px; border-radius: 16px; cursor: pointer; display: flex; align-items: center; gap: 12px; color: var(--sub); text-decoration: none; font-weight: 600; margin-bottom: 8px; transition: 0.3s; }
    .nav-item:hover { background: var(--p-soft); color: var(--p); transform: translateX(5px); }
    .nav-item.active { background: var(--p); color: white; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3); }

    .content { margin-left: 280px; flex: 1; padding: 40px; }

    /* Hiệu ứng chuyển tab mượt */
    .tab-content { animation: tabFade 0.5s ease-out; }
    @keyframes tabFade {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
    }

    .glass-card { 
        background: var(--card); 
        backdrop-filter: var(--blur);
        border: 1px solid var(--border); 
        border-radius: 24px; 
        padding: 25px; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
        margin-bottom: 25px; 
    }
    
    input, select { width: 100%; padding: 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg); color: var(--text); margin-bottom: 15px; outline: none; }
    input:focus { border-color: var(--p); box-shadow: 0 0 0 3px var(--p-soft); }

    .btn { padding: 12px 20px; border-radius: 14px; border: none; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; justify-content: center; transition: 0.3s; }
    .btn:active { transform: scale(0.95); }
    .btn-p { background: var(--p); color: white; }
    .btn-p:hover { box-shadow: 0 8px 15px rgba(99, 102, 241, 0.4); }
    .btn-outline { background: transparent; border: 1px solid var(--p); color: var(--p); }
    .btn-outline:hover { background: var(--p); color: white; }
    
    .action-container { position: relative; }
    .action-dropdown { display: none; position: absolute; right: 0; top: 100%; background: var(--card); backdrop-filter: var(--blur); border: 1px solid var(--border); border-radius: 12px; min-width: 180px; z-index: 500; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
    .action-dropdown a { display: block; padding: 12px 15px; color: var(--text); text-decoration: none; font-size: 14px; text-align: left; }
    .action-dropdown a:hover { background: var(--p-soft); color: var(--p); }

    .service-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
    .service-item { background: var(--card); backdrop-filter: var(--blur); border: 2px solid var(--border); border-radius: 20px; padding: 25px; text-align: center; cursor: pointer; transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .service-item:hover { border-color: var(--p); transform: translateY(-10px); background: var(--p-soft); }
    .service-item i { font-size: 35px; color: var(--p); margin-bottom: 15px; display: block; }

    table { width: 100%; border-collapse: collapse; }
    th { padding: 15px; color: var(--sub); text-align: left; border-bottom: 1px solid var(--border); font-size: 13px; }
    td { padding: 15px; border-bottom: 1px solid var(--border); font-size: 14px; }

    .badge { padding: 6px 12px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; }
    .badge-wait { background: var(--p-soft); color: var(--p); }
    .badge-done { background: rgba(16, 185, 129, 0.1); color: var(--success); }
    .badge-cancel { background: rgba(239, 68, 68, 0.1); color: var(--danger); }

    @keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>

<script>
    // Logic thực thi ngay lập tức để tránh nháy màn hình (FOUC)
    (function() {
        const mode = localStorage.getItem('theme-mode') || 'dark';
        if (mode === 'light') document.documentElement.classList.add('light-mode');
        
        const bg = localStorage.getItem('app-bg');
        if (bg) document.addEventListener('DOMContentLoaded', () => document.body.style.backgroundImage = \`url('\${bg}')\`);
    })();

    function toggleMode() {
        const isLight = document.documentElement.classList.toggle('light-mode');
        localStorage.setItem('theme-mode', isLight ? 'light' : 'dark');
    }

    function changeBg(url) {
        if(!url) url = prompt("Nhập link ảnh nền (URL):");
        if(url) {
            document.body.style.backgroundImage = \`url('\${url}')\`;
            localStorage.setItem('app-bg', url);
        }
    }
</script>
`;

// --- ROUTES GIAO DIỆN ---

app.get('/login', (req, res) => {
    res.send(`<html><head>${UI_ENGINE}</head><body style="display:flex;align-items:center;justify-content:center;height:100vh;">
        <div class="glass-card" style="width:400px; text-align:center;">
            <h1 style="color:var(--p); font-size:28px;">ĐĂNG NHẬP</h1>
            <p style="color:var(--sub); margin-bottom:30px;">Hệ thống WEB ĐẶT LỊCH 2026</p>
            <form action="/api/login" method="POST">
                <input type="text" name="u" placeholder="Tên đăng nhập" required>
                <input type="password" name="p" placeholder="Mật khẩu" required>
                <button type="submit" class="btn btn-p" style="width:100%">TRUY CẬP HỆ THỐNG</button>
            </form>
            <p style="margin-top:20px; font-size:14px;">Chưa có tài khoản? <a href="/register" style="color:var(--p); text-decoration:none; font-weight:700;">Đăng ký ngay</a></p>
        </div>
    </body></html>`);
});

app.get('/register', (req, res) => {
    res.send(`<html><head>${UI_ENGINE}</head><body style="display:flex;align-items:center;justify-content:center;height:100vh;">
        <div class="glass-card" style="width:400px; text-align:center;">
            <h1 style="color:var(--p);">ĐĂNG KÝ</h1><br>
            <form action="/api/register" method="POST">
                <input type="text" name="u" placeholder="Tên đăng nhập mới" required>
                <input type="password" name="p" placeholder="Mật khẩu bảo mật" required>
                <button type="submit" class="btn btn-p" style="width:100%">KHỞI TẠO TÀI KHOẢN</button>
            </form>
            <a href="/login" style="display:block; margin-top:20px; color:var(--sub); text-decoration:none; font-size:14px;">Quay lại Đăng nhập</a>
        </div>
    </body></html>`);
});

app.get('/', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        let pool = await sql.connect(dbConfig);
        const kh = await pool.request().query("SELECT * FROM KhachHang ORDER BY MaKH DESC");
        const activeTab = req.query.tab || 'dash';

        res.send(`
        <html>
        <head>
            <title>WEB ĐẶT LỊCH | ${req.session.user.name}</title>
            ${UI_ENGINE}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        </head>
        <body>
            <div class="app-container">
                <div class="sidebar">
                    <h2 style="color:var(--p); margin-bottom:35px; display:flex; align-items:center; gap:10px; padding:0 10px;">
                        <i class="fas fa-calendar-check"></i> WEB ĐẶT LỊCH
                    </h2>
                    
                    <div style="background:var(--p-soft); padding:15px; border-radius:18px; display:flex; align-items:center; gap:12px; margin-bottom:25px;">
                        <img src="${req.session.user.avatar}" style="width:45px; height:45px; border-radius:12px; object-fit:cover; border:2px solid var(--p);">
                        <div style="overflow:hidden">
                            <p style="font-weight:800; font-size:14px; white-space:nowrap; text-overflow:ellipsis;">${req.session.user.name}</p>
                            <span style="font-size:10px; color:var(--success); font-weight:700;">● ONLINE</span>
                        </div>
                    </div>

                    <div class="nav-item ${activeTab === 'dash' ? 'active' : ''}" onclick="tab('dash')"><i class="fas fa-chart-line"></i> Tổng quan</div>
                    <div class="nav-item ${activeTab === 'book' ? 'active' : ''}" onclick="tab('book')"><i class="fas fa-calendar-alt"></i> Quản lý lịch</div>
                    <div class="nav-item ${activeTab === 'serv' ? 'active' : ''}" onclick="tab('serv')"><i class="fas fa-plus-circle"></i> Đặt lịch mới</div>
                    <div class="nav-item ${activeTab === 'prof' ? 'active' : ''}" onclick="tab('prof')"><i class="fas fa-user-cog"></i> Cá nhân</div>
                    
                    <button class="btn btn-outline" style="width:100%; margin-top:20px; font-size:13px;" onclick="toggleMode()">
                        <i class="fas fa-adjust"></i> Đổi giao diện Sáng/Tối
                    </button>

                    <a href="/logout" class="nav-item" style="margin-top:auto; color:var(--danger)"><i class="fas fa-power-off"></i> Đăng xuất</a>
                </div>

                <div class="content">
                    <div id="dash" class="tab-content" style="display:${activeTab === 'dash' ? 'block' : 'none'}">
                        <h1 style="font-size:32px; font-weight:800;">Xin chào, ${req.session.user.name}</h1>
                        <p style="color:var(--sub);">Chào mừng bạn quay trở lại hệ thống.</p><br>
                        
                        <div class="service-grid">
                            <div class="glass-card">
                                <i class="fas fa-user-friends" style="color:var(--p); font-size:24px;"></i>
                                <h2 style="font-size:32px; margin:10px 0;">${kh.recordset.length}</h2>
                                <p style="color:var(--sub); font-size:14px;">Tổng khách hàng</p>
                            </div>
                            <div class="glass-card">
                                <i class="fas fa-clock" style="color:var(--warning); font-size:24px;"></i>
                                <h2 style="font-size:32px; margin:10px 0;" id="live-clock">--:--:--</h2>
                                <p style="color:var(--sub); font-size:14px;">Thời gian thực</p>
                            </div>
                            <div class="glass-card">
                                <i class="fas fa-shield-alt" style="color:var(--success); font-size:24px;"></i>
                                <h2 style="font-size:32px; margin:10px 0;">Bảo mật</h2>
                                <p style="color:var(--sub); font-size:14px;">SSL Enabled</p>
                            </div>
                        </div>

                        <div class="glass-card">
                            <h3 style="margin-bottom:20px">Hoạt động gần đây</h3>
                            <table>
                                <thead>
                                    <tr><th>Khách hàng</th><th>Dịch vụ</th><th>Thời gian</th></tr>
                                </thead>
                                <tbody>
                                    ${kh.recordset.slice(0, 5).map(r => `
                                        <tr>
                                            <td><b>${r.TenKH}</b></td>
                                            <td><span style="color:var(--p)">${r.DichVu}</span></td>
                                            <td>${new Date(r.ThoiGian).toLocaleString('vi-VN')}</td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div id="book" class="tab-content" style="display:${activeTab === 'book' ? 'block' : 'none'}">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px;">
                            <h2>Quản lý danh sách đặt lịch</h2>
                            <button class="btn btn-p" onclick="tab('serv')"><i class="fas fa-plus"></i> ĐẶT LỊCH MỚI</button>
                        </div>
                        <div class="glass-card" style="padding:10px; overflow-x:auto;">
                            <table>
                                <thead>
                                    <tr>
                                        <th>Mã</th>
                                        <th>Khách hàng</th>
                                        <th>Chi tiết dịch vụ</th>
                                        <th>Trạng thái</th>
                                        <th style="text-align:right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${kh.recordset.map(r => `
                                    <tr>
                                        <td style="color:var(--sub)">#${r.MaKH}</td>
                                        <td>
                                            <div style="display:flex; align-items:center; gap:10px;">
                                                <div style="width:35px; height:35px; background:var(--p-soft); color:var(--p); border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:800;">${r.TenKH ? r.TenKH[0] : '?'}</div>
                                                <div><b>${r.TenKH}</b><br><small style="color:var(--sub)">${r.SoDienThoai}</small></div>
                                            </div>
                                        </td>
                                        <td>
                                            <b style="color:var(--p)">${r.DichVu}</b><br>
                                            <small style="color:var(--sub)"><i class="far fa-clock"></i> ${new Date(r.ThoiGian).toLocaleString('vi-VN')}</small>
                                        </td>
                                        <td>
                                            <span class="badge ${r.TrangThai === 'Đã xác nhận' ? 'badge-done' : r.TrangThai === 'Đã hủy' ? 'badge-cancel' : 'badge-wait'}">
                                                ${r.TrangThai}
                                            </span>
                                        </td>
                                        <td style="text-align:right">
                                            <div class="action-container">
                                                <button class="btn" style="background:var(--border)" onclick="toggleDrop(event, 'drop-${r.MaKH}')"><i class="fas fa-ellipsis-v"></i></button>
                                                <div class="action-dropdown" id="drop-${r.MaKH}">
                                                    <a href="/api/action?id=${r.MaKH}&a=confirm"><i class="fas fa-check-circle" style="color:var(--success)"></i> Xác nhận</a>
                                                    <a href="/api/action?id=${r.MaKH}&a=cancel"><i class="fas fa-times-circle" style="color:var(--warning)"></i> Hủy đơn</a>
                                                    <div style="height:1px; background:var(--border)"></div>
                                                    <a href="/api/action?id=${r.MaKH}&a=delete" style="color:var(--danger)" onclick="return confirm('Bạn chắc chắn muốn xóa?')"><i class="fas fa-trash-alt"></i> Xóa vĩnh viễn</a>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>`).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div id="serv" class="tab-content" style="display:${activeTab === 'serv' ? 'block' : 'none'}">
                        <h2>Trung tâm Dịch vụ</h2>
                        <p style="color:var(--sub); margin-bottom:30px;">Chọn loại hình bạn muốn đặt lịch</p>
                        
                        <div class="service-grid">
                            <div class="service-item" onclick="openSub('Bóng đá')"><i class="fas fa-futbol"></i><h3>Sân Bóng</h3></div>
                            <div class="service-item" onclick="openSub('Cầu lông')"><i class="fas fa-table-tennis"></i><h3>Cầu Lông</h3></div>
                            <div class="service-item" onclick="openSub('Spa')"><i class="fas fa-leaf"></i><h3>Spa & Beauty</h3></div>
                            <div class="service-item" onclick="openSub('Karaoke')"><i class="fas fa-music"></i><h3>Karaoke</h3></div>
                            <div class="service-item" onclick="openSub('Y tế')"><i class="fas fa-user-md"></i><h3>Phòng Khám</h3></div>
                            <div class="service-item" onclick="openSub('Gym')"><i class="fas fa-running"></i><h3>Gym & Yoga</h3></div>
                        </div>

                        <div id="sub-panel" class="glass-card" style="margin-top:30px; display:none;">
                            <h3 id="sub-title" style="color:var(--p)"></h3><br>
                            <div id="sub-options" style="display:flex; gap:10px; flex-wrap:wrap;"></div>
                        </div>
                    </div>

                    <div id="prof" class="tab-content" style="display:${activeTab === 'prof' ? 'block' : 'none'}">
                        <h2>Cài đặt cá nhân & Giao diện</h2><br>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:25px;">
                            <div class="glass-card">
                                <h3>Thông tin tài khoản</h3><br>
                                <form action="/api/update-profile" method="POST" enctype="multipart/form-data">
                                    <div style="text-align:center; margin-bottom:20px;">
                                        <div style="position:relative; display:inline-block;">
                                            <img src="${req.session.user.avatar}" id="pre-av" style="width:100px; height:100px; border-radius:20px; border:3px solid var(--p); object-fit:cover;">
                                            <label for="file-av" style="position:absolute; bottom:-5px; right:-5px; background:var(--p); width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:white;">
                                                <i class="fas fa-pen" style="font-size:12px;"></i>
                                            </label>
                                            <input type="file" id="file-av" name="avatar" style="display:none;" onchange="preview(this)">
                                        </div>
                                    </div>
                                    <input type="password" name="newpass" placeholder="Mật khẩu mới (để trống nếu không đổi)">
                                    <button type="submit" class="btn btn-p" style="width:100%">LƯU THAY ĐỔI</button>
                                </form>
                            </div>

                            <div class="glass-card">
                                <h3>Hình nền ứng dụng</h3><br>
                                <p style="font-size:13px; color:var(--sub); margin-bottom:15px;">Tùy chỉnh ảnh nền để hệ thống trông đẹp hơn.</p>
                                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-bottom:15px;">
                                    <button class="btn btn-outline" style="font-size:12px;" onclick="changeBg('https://images.unsplash.com/photo-1557683316-973673baf926')">Gradient Blue</button>
                                    <button class="btn btn-outline" style="font-size:12px;" onclick="changeBg('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986')">Space Dark</button>
                                    <button class="btn btn-outline" style="font-size:12px;" onclick="changeBg('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b')">Mountains</button>
                                    <button class="btn btn-outline" style="font-size:12px;" onclick="changeBg('')">Link ảnh khác...</button>
                                </div>
                                <button class="btn btn-p" style="width:100%; background:var(--danger)" onclick="localStorage.removeItem('app-bg'); location.reload();">XÓA ẢNH NỀN</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="modal-book" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:1000; align-items:center; justify-content:center; backdrop-filter: blur(8px);">
                <div class="glass-card" style="width:400px; animation: zoomIn 0.3s ease;">
                    <h2 style="margin-bottom:5px;">Xác nhận đặt lịch</h2>
                    <p style="margin-bottom:20px; font-size:14px;">Dịch vụ: <b id="final-dv-name" style="color:var(--p)"></b></p>
                    
                    <form action="/api/add-booking" method="POST">
                        <input type="hidden" name="dv" id="input-dv">
                        <input name="ten" placeholder="Tên của bạn" required>
                        <input name="sdt" placeholder="Số điện thoại" required>
                        <input type="datetime-local" name="tg" required>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; margin-top:10px;">
                            <button type="button" class="btn btn-outline" onclick="closeM()">HỦY</button>
                            <button type="submit" class="btn btn-p">XÁC NHẬN</button>
                        </div>
                    </form>
                </div>
            </div>

            <script>
                // Hàm chuyển tab cực mượt
                function tab(id) {
                    const url = new URL(window.location);
                    url.searchParams.set('tab', id);
                    window.location.href = url.href;
                }

                function toggleDrop(event, id) {
                    event.stopPropagation();
                    const d = document.getElementById(id);
                    const isOpen = d.style.display === 'block';
                    document.querySelectorAll('.action-dropdown').forEach(el => el.style.display = 'none');
                    d.style.display = isOpen ? 'none' : 'block';
                }

                function openSub(type) {
                    const panel = document.getElementById('sub-panel');
                    const options = document.getElementById('sub-options');
                    panel.style.display = 'block';
                    document.getElementById('sub-title').innerText = 'Chi tiết: ' + type;
                    
                    let data = [];
                    if(type === 'Bóng đá') data = ['Sân 5 Cỏ nhân tạo', 'Sân 7 Cỏ nhân tạo', 'Sân 11 (Cỏ tự nhiên)'];
                    if(type === 'Cầu lông') data = ['Sân đơn VIP', 'Sân đôi tiêu chuẩn', 'Thảm chuyên dụng'];
                    if(type === 'Spa') data = ['Massage Body', 'Chăm sóc da mặt', 'Làm Nail & Mi'];
                    if(type === 'Karaoke') data = ['Phòng Thường', 'Phòng VIP', 'Phòng Super VIP'];
                    if(type === 'Y tế') data = ['Khám tổng quát', 'Khám Răng', 'Xét nghiệm'];
                    if(type === 'Gym') data = ['Gói Gym tháng', 'Yoga Group', 'PT 1:1 Cao cấp'];

                    options.innerHTML = data.map(d => \`<button class="btn btn-outline" style="font-size:12px" onclick="openBooking('\${d}')">\${d}</button>\`).join('');
                    panel.scrollIntoView({behavior: 'smooth'});
                }

                function openBooking(dv) {
                    document.getElementById('modal-book').style.display = 'flex';
                    document.getElementById('final-dv-name').innerText = dv;
                    document.getElementById('input-dv').value = dv;
                }

                function closeM() { document.getElementById('modal-book').style.display = 'none'; }

                function preview(input) {
                    if (input.files && input.files[0]) {
                        var reader = new FileReader();
                        reader.onload = e => document.getElementById('pre-av').src = e.target.result;
                        reader.readAsDataURL(input.files[0]);
                    }
                }

                setInterval(() => {
                    const clock = document.getElementById('live-clock');
                    if(clock) clock.innerText = new Date().toLocaleTimeString('vi-VN');
                }, 1000);

                window.onclick = () => document.querySelectorAll('.action-dropdown').forEach(d => d.style.display = 'none');
            </script>
        </body></html>`);
    } catch (e) { 
        res.send(`<script>alert('Lỗi Database: ${e.message}'); window.location='/';</script>`); 
    }
});

// --- API HẬU ĐÀI ---

app.get(['/api/login', '/api/register', '/api/add-booking', '/api/update-profile'], (req, res) => res.redirect('/'));

app.post('/api/register', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const check = await pool.request().input('u', sql.NVarChar, req.body.u).query("SELECT * FROM TaiKhoan WHERE TenDangNhap = @u");
        if(check.recordset.length > 0) {
            return res.send("<script>alert('Tên đăng nhập này đã tồn tại!'); window.history.back();</script>");
        }
        const hashed = await bcrypt.hash(req.body.p, saltRounds);
        await pool.request()
            .input('u', sql.NVarChar, req.body.u)
            .input('p', sql.NVarChar, hashed)
            .query("INSERT INTO TaiKhoan (TenDangNhap, MatKhau, AnhDaiDien) VALUES (@u, @p, '/uploads/default-avatar.png')");
        res.send("<script>alert('Đăng ký thành công!'); window.location='/login';</script>");
    } catch (e) { res.send(`<script>alert('Lỗi: ${e.message}'); window.history.back();</script>`); }
});

app.post('/api/login', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const result = await pool.request().input('u', sql.NVarChar, req.body.u).query("SELECT * FROM TaiKhoan WHERE TenDangNhap = @u");
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const storedHash = user.MatKhau.trim(); 
            const match = await bcrypt.compare(req.body.p, storedHash);
            if (match) {
                req.session.user = { name: user.TenDangNhap, avatar: user.AnhDaiDien || '/uploads/default-avatar.png' };
                return res.redirect('/');
            }
        }
        res.send("<script>alert('Sai tài khoản hoặc mật khẩu!'); window.location='/login';</script>");
    } catch (e) { res.send(`<script>alert('Lỗi: ${e.message}'); window.location='/login';</script>`); }
});

app.post('/api/add-booking', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        let pool = await sql.connect(dbConfig);
        await pool.request()
            .input('t', sql.NVarChar, req.body.ten)
            .input('s', sql.NVarChar, req.body.sdt)
            .input('d', sql.NVarChar, req.body.dv)
            .input('tg', sql.DateTime, req.body.tg)
            .query("INSERT INTO KhachHang (TenKH, SoDienThoai, DichVu, ThoiGian, TrangThai) VALUES (@t, @s, @d, @tg, N'Chờ xác nhận')");
        res.redirect('/?tab=book');
    } catch (e) { res.send(`<script>alert('Lỗi lưu: ${e.message}'); window.location='/?tab=serv';</script>`); }
});

app.get('/api/action', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        let { id, a } = req.query;
        let pool = await sql.connect(dbConfig);
        let query = "";
        if (a === 'confirm') query = "UPDATE KhachHang SET TrangThai = N'Đã xác nhận' WHERE MaKH = @id";
        if (a === 'cancel') query = "UPDATE KhachHang SET TrangThai = N'Đã hủy' WHERE MaKH = @id";
        if (a === 'delete') query = "DELETE FROM KhachHang WHERE MaKH = @id";
        await pool.request().input('id', sql.Int, id).query(query);
        res.redirect('/?tab=book');
    } catch (e) { res.send(`<script>alert('Lỗi: ${e.message}'); window.location='/?tab=book';</script>`); }
});

app.post('/api/update-profile', upload.single('avatar'), async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        let pool = await sql.connect(dbConfig);
        if (req.file) {
            let p = '/uploads/' + req.file.filename;
            await pool.request().input('av', sql.NVarChar, p).input('u', sql.NVarChar, req.session.user.name).query("UPDATE TaiKhoan SET AnhDaiDien = @av WHERE TenDangNhap = @u");
            req.session.user.avatar = p;
        }
        if (req.body.newpass) {
            const h = await bcrypt.hash(req.body.newpass, saltRounds);
            await pool.request().input('h', sql.NVarChar, h).input('u', sql.NVarChar, req.session.user.name).query("UPDATE TaiKhoan SET MatKhau = @h WHERE TenDangNhap = @u");
        }
        res.send("<script>alert('Đã cập nhật!'); window.location='/?tab=prof';</script>");
    } catch (e) { res.send(`<script>alert('Lỗi: ${e.message}'); window.location='/?tab=prof';</script>`); }
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/login'); });

app.listen(PORT, () => console.log('🚀 SERVER READY: http://localhost:3000/login'));