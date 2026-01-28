/**
 * ============================================================================
 * PROJECT: WEB ĐẶT LỊCH - VERSION 16.0 (ULTRA CUSTOM BLEND)
 * FEATURE: V15.0 + TÍNH NĂNG UPLOAD ẢNH NỀN TÙY CHỈNH (AJAX NO-RELOAD)
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
    password: 'D0anNhom@2026', // Mật khẩu của Khang
    server: 'localhost',
    database: 'QuanLyDatLich',
    options: { encrypt: false, trustServerCertificate: true }
};

// Cấu hình lưu trữ file (Dùng chung cho Avatar và Ảnh nền mới)
const storage = multer.diskStorage({
    destination: './uploads/',
    filename: (req, file, cb) => {
        // Thêm tiền tố để phân biệt loại file nếu cần sau này
        const prefix = file.fieldname === 'bgFile' ? 'bg-' : 'avatar-';
        cb(null, prefix + Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/uploads', express.static('uploads')); // Cho phép truy cập thư mục ảnh
app.use(session({
    secret: 'web_dat_lich_supreme_secret_2026_v16', // Đổi secret key mới cho ngầu
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 86400000 * 7 } // Nhớ đăng nhập 7 ngày luôn
}));

// --- ENGINE GIAO DIỆN (CSS & JS SHARED - ĐÃ NÂNG CẤP CHO V16) ---
const UI_ENGINE = `
<style>
    /* Import font xịn xò */
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');
    
    /* Bộ màu gốc (Dark Mode) */
    :root {
        --p: #6366f1; --p-soft: rgba(99, 102, 241, 0.1);
        --bg: #0b0f1a; --card: rgba(21, 27, 45, 0.85); --text: #f1f5f9; --sub: #94a3b8;
        --border: rgba(255, 255, 255, 0.08); --danger: #ef4444; --success: #10b981; --warning: #f59e0b;
        --blur: blur(15px);
    }

    /* Bộ màu khi bật đèn (Light Mode) */
    html.light-mode {
        --bg: #f8fafc; --card: rgba(255, 255, 255, 0.85); --text: #1e293b; --sub: #64748b;
        --border: rgba(0, 0, 0, 0.08);
    }

    /* Reset và hiệu ứng chung */
    * { margin: 0; padding: 0; box-sizing: border-box; font-family: 'Plus Jakarta Sans', sans-serif; transition: background 0.4s, color 0.3s, border 0.3s, box-shadow 0.3s; }
    
    body { 
        background: var(--bg); 
        color: var(--text); 
        overflow-x: hidden; 
        background-size: cover; 
        background-position: center; 
        background-attachment: fixed; /* Giữ ảnh nền cố định khi cuộn */
    }

    /* Layout chính */
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

    /* Hiệu ứng chuyển tab mượt mà */
    .tab-content { animation: tabFade 0.5s ease-out; }
    @keyframes tabFade {
        from { opacity: 0; transform: translateY(15px); }
        to { opacity: 1; transform: translateY(0); }
    }

    /* Component thẻ kính (Glassmorphism) */
    .glass-card { 
        background: var(--card); 
        backdrop-filter: var(--blur);
        border: 1px solid var(--border); 
        border-radius: 24px; 
        padding: 25px; 
        box-shadow: 0 10px 30px rgba(0,0,0,0.1); 
        margin-bottom: 25px;
        transition: transform 0.3s;
    }
    
    /* Các input và nút bấm */
    input, select { width: 100%; padding: 14px; border-radius: 12px; border: 1px solid var(--border); background: var(--bg); color: var(--text); margin-bottom: 15px; outline: none; }
    input:focus { border-color: var(--p); box-shadow: 0 0 0 3px var(--p-soft); }

    .btn { padding: 12px 20px; border-radius: 14px; border: none; font-weight: 700; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; justify-content: center; transition: 0.3s; white-space: nowrap; }
    .btn:active { transform: scale(0.95); }
    .btn:disabled { opacity: 0.7; cursor: not-allowed; }
    .btn-p { background: var(--p); color: white; }
    .btn-p:hover:not(:disabled) { box-shadow: 0 8px 15px rgba(99, 102, 241, 0.4); transform: translateY(-2px); }
    .btn-outline { background: transparent; border: 1px solid var(--p); color: var(--p); }
    .btn-outline:hover:not(:disabled) { background: var(--p); color: white; }
    
    /* Dropdown menu (cho nút 3 chấm) */
    .action-container { position: relative; }
    .action-dropdown { display: none; position: absolute; right: 0; top: 100%; background: var(--card); backdrop-filter: var(--blur); border: 1px solid var(--border); border-radius: 12px; min-width: 180px; z-index: 500; box-shadow: 0 10px 25px rgba(0,0,0,0.4); }
    .action-dropdown a { display: block; padding: 12px 15px; color: var(--text); text-decoration: none; font-size: 14px; text-align: left; transition: 0.2s; }
    .action-dropdown a:hover { background: var(--p-soft); color: var(--p); padding-left: 20px; }

    /* Lưới dịch vụ */
    .service-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
    .service-item { background: var(--card); backdrop-filter: var(--blur); border: 2px solid var(--border); border-radius: 20px; padding: 25px; text-align: center; cursor: pointer; transition: 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275); }
    .service-item:hover { border-color: var(--p); transform: translateY(-10px) scale(1.02); background: var(--p-soft); box-shadow: 0 15px 30px rgba(0,0,0,0.1); }
    .service-item i { font-size: 35px; color: var(--p); margin-bottom: 15px; display: block; }

    /* Bảng dữ liệu */
    table { width: 100%; border-collapse: collapse; }
    th { padding: 15px; color: var(--sub); text-align: left; border-bottom: 1px solid var(--border); font-size: 13px; text-transform: uppercase; letter-spacing: 1px; }
    td { padding: 15px; border-bottom: 1px solid var(--border); font-size: 14px; vertical-align: middle; }

    /* Huy hiệu trạng thái */
    .badge { padding: 6px 12px; border-radius: 8px; font-size: 10px; font-weight: 800; text-transform: uppercase; display: inline-block; }
    .badge-wait { background: var(--p-soft); color: var(--p); }
    .badge-done { background: rgba(16, 185, 129, 0.15); color: var(--success); }
    .badge-cancel { background: rgba(239, 68, 68, 0.15); color: var(--danger); }

    /* Hiệu ứng Zoom cho Modal */
    @keyframes zoomIn { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
</style>

<script>
    // --- LOGIC KHỞI TẠO (Chạy ngay lập tức) ---
    (function() {
        // Khôi phục chế độ Sáng/Tối từ Local Storage
        const mode = localStorage.getItem('theme-mode') || 'dark';
        if (mode === 'light') document.documentElement.classList.add('light-mode');
        
        // Khôi phục ảnh nền từ Local Storage (URL hoặc đường dẫn file)
        const bg = localStorage.getItem('app-bg');
        if (bg) {
            // Đợi DOM load xong mới áp dụng để tránh lỗi
            document.addEventListener('DOMContentLoaded', () => {
                document.body.style.backgroundImage = \`url('\${bg}')\`;
            });
        }
    })();

    // Hàm đổi chế độ Sáng/Tối
    function toggleMode() {
        const isLight = document.documentElement.classList.toggle('light-mode');
        localStorage.setItem('theme-mode', isLight ? 'light' : 'dark');
    }

    // Hàm thay đổi ảnh nền (Dùng chung cho cả URL và File upload)
    function changeBg(url) {
        // Nếu không truyền URL, hỏi người dùng nhập link (cách cũ)
        if(!url && url !== '') url = prompt("Nhập link ảnh nền online (URL):");
        
        if(url !== null) { // Kiểm tra nếu người dùng không bấm Hủy
            document.body.style.backgroundImage = \`url('\${url}')\`;
            if(url) {
                localStorage.setItem('app-bg', url); // Lưu lại nếu có ảnh
            } else {
                localStorage.removeItem('app-bg'); // Xóa nếu là chuỗi rỗng (Reset)
                location.reload(); // Load lại để về mặc định
            }
        }
    }

    // --- MỚI: CÁC HÀM XỬ LÝ UPLOAD ẢNH NỀN TỪ FILE (V16.0) ---

    // 1. Xử lý khi người dùng chọn file từ máy
    function handleBgSelect(input) {
        const fileNameDisplay = document.getElementById('bg-file-name');
        const saveBtn = document.getElementById('btn-save-bg');
        
        if (input.files && input.files[0]) {
            // Hiện tên file và nút Lưu
            fileNameDisplay.innerText = 'Đã chọn: ' + input.files[0].name;
            fileNameDisplay.style.color = 'var(--p)';
            saveBtn.style.display = 'inline-flex';
            saveBtn.classList.add('animate__animated', 'animate__fadeIn'); // Thêm tí hiệu ứng nếu thích
        } else {
            // Ẩn nếu bỏ chọn
            fileNameDisplay.innerText = '';
            saveBtn.style.display = 'none';
        }
    }

    // 2. Gửi file lên server bằng AJAX (Không load lại trang)
    async function uploadBgFile() {
        const input = document.getElementById('bg-upload-input');
        const saveBtn = document.getElementById('btn-save-bg');

        if (!input.files || !input.files[0]) {
            alert("Vui lòng chọn một tệp ảnh trước!");
            return;
        }

        // Tạo form data để gửi file
        const formData = new FormData();
        formData.append('bgFile', input.files[0]); // 'bgFile' là tên field nhận ở server

        // Đổi trạng thái nút bấm
        const originalBtnText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang tải lên...';
        saveBtn.disabled = true;

        try {
            // Gọi API upload mới
            const response = await fetch('/api/upload-bg', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.success) {
                // Nếu thành công: Áp dụng ngay đường dẫn ảnh mới nhận được từ server
                changeBg(data.path); 
                alert("Tuyệt vời! Ảnh nền mới đã được áp dụng.");
                
                // Reset lại giao diện upload
                input.value = '';
                document.getElementById('bg-file-name').innerText = '';
                saveBtn.style.display = 'none';
            } else {
                alert('Lỗi upload: ' + data.error);
            }
        } catch (error) {
            console.error('Lỗi upload:', error);
            alert('Không thể kết nối đến server. Vui lòng thử lại.');
        } finally {
            // Khôi phục nút bấm dù thành công hay thất bại
            saveBtn.innerHTML = originalBtnText;
            saveBtn.disabled = false;
        }
    }
</script>
`;

// --- ROUTES GIAO DIỆN (GIỮ NGUYÊN LOGIC V15) ---

app.get('/login', (req, res) => {
    res.send(`<html><head><title>Đăng nhập | Web Đặt Lịch</title>${UI_ENGINE}<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;">
        <div class="glass-card" style="width:400px; text-align:center; padding:40px;">
            <div style="width:60px; height:60px; background:var(--p); border-radius:15px; margin:0 auto 20px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-calendar-check" style="font-size:30px; color:white;"></i></div>
            <h1 style="color:var(--p); font-size:28px;">CHÀO MỪNG TRỞ LẠI</h1>
            <p style="color:var(--sub); margin-bottom:30px;">Đăng nhập để quản lý lịch hẹn của bạn</p>
            <form action="/api/login" method="POST">
                <div style="position:relative"><i class="fas fa-user" style="position:absolute; left:15px; top:15px; color:var(--sub)"></i><input type="text" name="u" placeholder="Tên đăng nhập" required style="padding-left:45px;"></div>
                <div style="position:relative"><i class="fas fa-lock" style="position:absolute; left:15px; top:15px; color:var(--sub)"></i><input type="password" name="p" placeholder="Mật khẩu" required style="padding-left:45px;"></div>
                <button type="submit" class="btn btn-p" style="width:100%; padding:15px; font-size:16px;">TRUY CẬP HỆ THỐNG <i class="fas fa-arrow-right"></i></button>
            </form>
            <p style="margin-top:25px; font-size:14px; color:var(--sub)">Chưa có tài khoản? <a href="/register" style="color:var(--p); text-decoration:none; font-weight:800;">Đăng ký ngay</a></p>
        </div>
    </body></html>`);
});

app.get('/register', (req, res) => {
    res.send(`<html><head><title>Đăng ký | Web Đặt Lịch</title>${UI_ENGINE}<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"></head><body style="display:flex;align-items:center;justify-content:center;height:100vh;">
        <div class="glass-card" style="width:400px; text-align:center; padding:40px;">
            <h1 style="color:var(--p);">TẠO TÀI KHOẢN MỚI</h1><p style="color:var(--sub); margin-bottom:30px;">Tham gia hệ thống đặt lịch V16.0</p>
            <form action="/api/register" method="POST">
                <div style="position:relative"><i class="fas fa-user-plus" style="position:absolute; left:15px; top:15px; color:var(--sub)"></i><input type="text" name="u" placeholder="Tên đăng nhập mong muốn" required style="padding-left:45px;"></div>
                <div style="position:relative"><i class="fas fa-key" style="position:absolute; left:15px; top:15px; color:var(--sub)"></i><input type="password" name="p" placeholder="Mật khẩu bảo mật" required style="padding-left:45px;"></div>
                <button type="submit" class="btn btn-p" style="width:100%; padding:15px; font-size:16px;">KHỞI TẠO TÀI KHOẢN</button>
            </form>
            <a href="/login" class="btn btn-outline" style="width:100%; margin-top:15px;"><i class="fas fa-arrow-left"></i> Quay lại Đăng nhập</a>
        </div>
    </body></html>`);
});

app.get('/', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        let pool = await sql.connect(dbConfig);
        const kh = await pool.request().query("SELECT * FROM KhachHang ORDER BY ThoiGian DESC"); // Sắp xếp mới nhất lên đầu
        const activeTab = req.query.tab || 'dash';

        res.send(`
        <html>
        <head>
            <title>WEB ĐẶT LỊCH V16 | ${req.session.user.name}</title>
            ${UI_ENGINE}
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/animate.css/4.1.1/animate.min.css"/>
        </head>
        <body>
            <div class="app-container">
                <div class="sidebar">
                    <h2 style="color:var(--p); margin-bottom:35px; display:flex; align-items:center; gap:10px; padding:0 10px; font-size:22px;">
                        <i class="fas fa-calendar-check animate__animated animate__pulse animate__infinite"></i> WEB ĐẶT LỊCH
                    </h2>
                    
                    <div style="background:var(--p-soft); padding:15px; border-radius:18px; display:flex; align-items:center; gap:12px; margin-bottom:25px; border:1px solid var(--p);">
                        <img src="${req.session.user.avatar}" style="width:45px; height:45px; border-radius:12px; object-fit:cover; border:2px solid var(--p); box-shadow: 0 5px 15px rgba(99, 102, 241, 0.3);">
                        <div style="overflow:hidden">
                            <p style="font-weight:800; font-size:14px; white-space:nowrap; text-overflow:ellipsis;">${req.session.user.name}</p>
                            <span style="font-size:10px; color:var(--success); font-weight:700; display:flex; align-items:center; gap:5px;"><i class="fas fa-circle" style="font-size:6px;"></i> ONLINE V16.0</span>
                        </div>
                    </div>

                    <div class="nav-item ${activeTab === 'dash' ? 'active' : ''}" onclick="tab('dash')"><i class="fas fa-chart-pie"></i> Tổng quan</div>
                    <div class="nav-item ${activeTab === 'book' ? 'active' : ''}" onclick="tab('book')"><i class="fas fa-list-alt"></i> Quản lý lịch</div>
                    <div class="nav-item ${activeTab === 'serv' ? 'active' : ''}" onclick="tab('serv')"><i class="fas fa-plus-square"></i> Đặt lịch mới</div>
                    <div class="nav-item ${activeTab === 'prof' ? 'active' : ''}" onclick="tab('prof')"><i class="fas fa-sliders-h"></i> Cá nhân & Cài đặt</div>
                    
                    <button class="btn btn-outline" style="width:100%; margin-top:20px; font-size:13px; justify-content: space-between;" onclick="toggleMode()">
                        <span>Chế độ Sáng/Tối</span> <i class="fas fa-adjust"></i>
                    </button>

                    <a href="/logout" class="nav-item" style="margin-top:auto; color:var(--danger); background: rgba(239, 68, 68, 0.1);"><i class="fas fa-sign-out-alt"></i> Đăng xuất</a>
                </div>

                <div class="content">
                    <div id="dash" class="tab-content" style="display:${activeTab === 'dash' ? 'block' : 'none'}">
                        <div style="margin-bottom:35px;">
                            <h1 style="font-size:36px; font-weight:800; background: linear-gradient(to right, var(--p), #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">Xin chào, ${req.session.user.name}!</h1>
                            <p style="color:var(--sub); font-size:16px;">Hệ thống đã sẵn sàng. Chúc bạn một ngày làm việc hiệu quả.</p>
                        </div>
                        
                        <div class="service-grid" style="margin-bottom:35px;">
                            <div class="glass-card" style="display:flex; align-items:center; gap:20px;">
                                <div style="width:60px; height:60px; background:var(--p-soft); border-radius:15px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-users" style="color:var(--p); font-size:28px;"></i></div>
                                <div><h2 style="font-size:32px; margin:0;">${kh.recordset.length}</h2><p style="color:var(--sub); font-size:14px;">Tổng lịch đặt</p></div>
                            </div>
                            <div class="glass-card" style="display:flex; align-items:center; gap:20px;">
                                <div style="width:60px; height:60px; background:rgba(245, 158, 11, 0.1); border-radius:15px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-clock" style="color:var(--warning); font-size:28px;"></i></div>
                                <div><h2 style="font-size:32px; margin:0;" id="live-clock">--:--:--</h2><p style="color:var(--sub); font-size:14px;">Thời gian thực</p></div>
                            </div>
                            <div class="glass-card" style="display:flex; align-items:center; gap:20px;">
                                <div style="width:60px; height:60px; background:rgba(16, 185, 129, 0.1); border-radius:15px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-shield-check" style="color:var(--success); font-size:28px;"></i></div>
                                <div><h2 style="font-size:32px; margin:0;">An toàn</h2><p style="color:var(--sub); font-size:14px;">Hệ thống bảo mật</p></div>
                            </div>
                        </div>

                        <div class="glass-card">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                                <h3><i class="fas fa-history" style="color:var(--p); margin-right:10px;"></i>Hoạt động gần đây</h3>
                                <button class="btn btn-outline" style="font-size:12px; padding:8px 15px;" onclick="tab('book')">Xem tất cả <i class="fas fa-arrow-right"></i></button>
                            </div>
                            <table>
                                <thead>
                                    <tr><th>Khách hàng</th><th>Dịch vụ</th><th>Thời gian & Trạng thái</th></tr>
                                </thead>
                                <tbody>
                                    ${kh.recordset.slice(0, 5).map(r => `
                                        <tr>
                                            <td><div style="display:flex; align-items:center; gap:10px;"><div style="width:30px; height:30px; background:var(--border); border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:bold; font-size:12px;">${r.TenKH ? r.TenKH[0].toUpperCase() : '?'}</div><b>${r.TenKH}</b></div></td>
                                            <td><span style="color:var(--p); font-weight:600;">${r.DichVu}</span></td>
                                            <td>
                                                <div style="display:flex; flex-direction:column; gap:5px;">
                                                    <small style="color:var(--sub)"><i class="far fa-clock"></i> ${new Date(r.ThoiGian).toLocaleString('vi-VN', {hour12: false})}</small>
                                                    <span class="badge ${r.TrangThai === 'Đã xác nhận' ? 'badge-done' : r.TrangThai === 'Đã hủy' ? 'badge-cancel' : 'badge-wait'}" style="width:fit-content;">${r.TrangThai}</span>
                                                </div>
                                            </td>
                                        </tr>
                                    `).join('') || '<tr><td colspan="3" style="text-align:center; padding:30px; color:var(--sub);">Chưa có dữ liệu hoạt động.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div id="book" class="tab-content" style="display:${activeTab === 'book' ? 'block' : 'none'}">
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:25px; flex-wrap:wrap; gap:15px;">
                            <div>
                                <h2 style="margin-bottom:5px;">Quản lý danh sách đặt lịch</h2>
                                <p style="color:var(--sub);">Xem và xử lý các yêu cầu đặt lịch hẹn.</p>
                            </div>
                            <button class="btn btn-p" onclick="tab('serv')"><i class="fas fa-plus-circle"></i> TẠO LỊCH MỚI</button>
                        </div>
                        <div class="glass-card" style="padding:10px; overflow-x:auto;">
                            <table style="min-width: 800px;">
                                <thead>
                                    <tr>
                                        <th style="width:80px;">ID</th>
                                        <th>Thông tin Khách hàng</th>
                                        <th>Chi tiết dịch vụ</th>
                                        <th>Trạng thái</th>
                                        <th style="text-align:right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${kh.recordset.map(r => `
                                    <tr>
                                        <td style="color:var(--sub); font-family:monospace;">#${r.MaKH.toString().padStart(4, '0')}</td>
                                        <td>
                                            <div style="display:flex; align-items:center; gap:12px;">
                                                <div style="width:40px; height:40px; background:linear-gradient(135deg, var(--p), #a855f7); color:white; border-radius:12px; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:16px; box-shadow: 0 5px 10px rgba(99, 102, 241, 0.3);">${r.TenKH ? r.TenKH[0].toUpperCase() : '?'}</div>
                                                <div><b style="font-size:15px;">${r.TenKH}</b><br><small style="color:var(--sub); display:flex; align-items:center; gap:5px;"><i class="fas fa-phone-alt" style="font-size:11px;"></i> ${r.SoDienThoai}</small></div>
                                            </div>
                                        </td>
                                        <td>
                                            <b style="color:var(--p); font-size:15px;">${r.DichVu}</b><br>
                                            <small style="color:var(--sub); display:flex; align-items:center; gap:5px; margin-top:3px;"><i class="far fa-calendar-alt" style="font-size:11px;"></i> ${new Date(r.ThoiGian).toLocaleDateString('vi-VN')} <i class="far fa-clock" style="font-size:11px; margin-left:5px;"></i> ${new Date(r.ThoiGian).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit', hour12: false})}</small>
                                        </td>
                                        <td>
                                            <span class="badge ${r.TrangThai === 'Đã xác nhận' ? 'badge-done' : r.TrangThai === 'Đã hủy' ? 'badge-cancel' : 'badge-wait'}" style="padding: 8px 12px; font-size: 11px;">
                                                ${r.TrangThai === 'Chờ xác nhận' ? '<i class="fas fa-spinner fa-spin" style="margin-right:5px;"></i>' : ''} ${r.TrangThai}
                                            </span>
                                        </td>
                                        <td style="text-align:right">
                                            <div class="action-container">
                                                <button class="btn" style="background:var(--border); width:35px; height:35px; padding:0; border-radius:50%;" onclick="toggleDrop(event, 'drop-${r.MaKH}')"><i class="fas fa-ellipsis-h"></i></button>
                                                <div class="action-dropdown animate__animated animate__fadeIn animate__faster" id="drop-${r.MaKH}">
                                                    <a href="/api/action?id=${r.MaKH}&a=confirm"><i class="fas fa-check-circle" style="color:var(--success); margin-right:8px;"></i> Xác nhận lịch</a>
                                                    <a href="/api/action?id=${r.MaKH}&a=cancel"><i class="fas fa-times-circle" style="color:var(--warning); margin-right:8px;"></i> Hủy lịch này</a>
                                                    <div style="height:1px; background:var(--border); margin:5px 0;"></div>
                                                    <a href="/api/action?id=${r.MaKH}&a=delete" style="color:var(--danger)" onclick="return confirm('Hành động này không thể hoàn tác. Bạn chắc chắn muốn xóa vĩnh viễn?')"><i class="fas fa-trash-alt" style="margin-right:8px;"></i> Xóa dữ liệu</a>
                                                </div>
                                            </div>
                                        </td>
                                    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--sub);"><i class="fas fa-inbox" style="font-size:40px; margin-bottom:15px; opacity:0.5;"></i><br>Chưa có lịch đặt nào.</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <div id="serv" class="tab-content" style="display:${activeTab === 'serv' ? 'block' : 'none'}">
                        <div style="text-align:center; margin-bottom:40px;">
                            <h2 style="font-size:32px; margin-bottom:10px;">Trung tâm Dịch vụ</h2>
                            <p style="color:var(--sub); max-width:600px; margin:0 auto;">Chọn loại hình dịch vụ bạn muốn đặt lịch. Chúng tôi cung cấp đa dạng các lựa chọn chất lượng cao.</p>
                        </div>
                        
                        <div class="service-grid">
                            <div class="service-item animate__animated animate__fadeInUp" style="animation-delay: 0.1s" onclick="openSub('Bóng đá')"><i class="fas fa-futbol"></i><h3>Sân Bóng Đá</h3><p style="font-size:13px; color:var(--sub);">Sân cỏ nhân tạo & tự nhiên</p></div>
                            <div class="service-item animate__animated animate__fadeInUp" style="animation-delay: 0.2s" onclick="openSub('Cầu lông')"><i class="fas fa-table-tennis"></i><h3>Sân Cầu Lông</h3><p style="font-size:13px; color:var(--sub);">Sân thảm tiêu chuẩn thi đấu</p></div>
                            <div class="service-item animate__animated animate__fadeInUp" style="animation-delay: 0.3s" onclick="openSub('Spa')"><i class="fas fa-spa"></i><h3>Spa & Beauty</h3><p style="font-size:13px; color:var(--sub);">Chăm sóc sức khỏe & sắc đẹp</p></div>
                            <div class="service-item animate__animated animate__fadeInUp" style="animation-delay: 0.4s" onclick="openSub('Karaoke')"><i class="fas fa-microphone-alt"></i><h3>Giải trí Karaoke</h3><p style="font-size:13px; color:var(--sub);">Âm thanh sống động, phòng VIP</p></div>
                            <div class="service-item animate__animated animate__fadeInUp" style="animation-delay: 0.5s" onclick="openSub('Y tế')"><i class="fas fa-stethoscope"></i><h3>Dịch vụ Y tế</h3><p style="font-size:13px; color:var(--sub);">Khám và tư vấn sức khỏe</p></div>
                            <div class="service-item animate__animated animate__fadeInUp" style="animation-delay: 0.6s" onclick="openSub('Gym')"><i class="fas fa-dumbbell"></i><h3>Gym & Fitness</h3><p style="font-size:13px; color:var(--sub);">PT chuyên nghiệp, máy hiện đại</p></div>
                        </div>

                        <div id="sub-panel" class="glass-card animate__animated animate__fadeInUp" style="margin-top:40px; display:none; border-top: 3px solid var(--p);">
                            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                                <h3 id="sub-title" style="color:var(--p); font-size:24px; display:flex; align-items:center; gap:10px;"></h3>
                                <button class="btn btn-outline" onclick="document.getElementById('sub-panel').style.display='none'" style="padding: 5px 10px;"><i class="fas fa-times"></i> Đóng</button>
                            </div>
                            <p style="color:var(--sub); margin-bottom:25px;">Vui lòng chọn gói dịch vụ cụ thể bên dưới để tiếp tục:</p>
                            <div id="sub-options" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(180px, 1fr)); gap:15px;"></div>
                        </div>
                    </div>

                    <div id="prof" class="tab-content" style="display:${activeTab === 'prof' ? 'block' : 'none'}">
                        <h2 style="margin-bottom:10px;">Cài đặt & Tùy chỉnh</h2>
                        <p style="color:var(--sub); margin-bottom:35px;">Quản lý thông tin cá nhân và giao diện ứng dụng.</p>
                        
                        <div style="display:grid; grid-template-columns: 350px 1fr; gap:35px; align-items:start;">
                            <div class="glass-card" style="text-align:center; position:sticky; top:110px;">
                                <h3 style="margin-bottom:25px; text-align:left;"><i class="fas fa-user-circle" style="color:var(--p); margin-right:10px;"></i>Hồ sơ của bạn</h3>
                                
                                <form action="/api/update-profile" method="POST" enctype="multipart/form-data">
                                    <div style="position:relative; display:inline-block; margin-bottom:25px;">
                                        <img src="${req.session.user.avatar}" id="pre-av" style="width:120px; height:120px; border-radius:30px; border:4px solid var(--p); object-fit:cover; box-shadow: 0 10px 20px rgba(99, 102, 241, 0.3);">
                                        <label for="file-av" style="position:absolute; bottom:-10px; right:-10px; background:var(--p); width:40px; height:40px; border-radius:50%; display:flex; align-items:center; justify-content:center; cursor:pointer; color:white; border:3px solid var(--card); transition:0.3s;">
                                            <i class="fas fa-camera"></i>
                                        </label>
                                        <input type="file" id="file-av" name="avatar" accept="image/*" style="display:none;" onchange="preview(this)">
                                    </div>
                                    
                                    <h2 style="margin-bottom:5px;">${req.session.user.name}</h2>
                                    <p class="badge badge-done" style="margin-bottom:25px;"> Tài khoản Hợp lệ</p>
                                    
                                    <div style="text-align:left;">
                                        <label style="font-size:13px; font-weight:700; margin-bottom:5px; display:block; color:var(--sub);">Đổi mật khẩu (Tùy chọn)</label>
                                        <div style="position:relative"><i class="fas fa-lock" style="position:absolute; left:15px; top:15px; color:var(--sub)"></i><input type="password" name="newpass" placeholder="Nhập mật khẩu mới..." style="padding-left:45px;"></div>
                                    </div>
                                    <button type="submit" class="btn btn-p" style="width:100%; margin-top:10px;"><i class="fas fa-save"></i> LƯU HỒ SƠ</button>
                                </form>
                            </div>

                            <div style="display:flex; flex-direction:column; gap:25px;">
                                <div class="glass-card">
                                    <h3 style="margin-bottom:20px;"><i class="fas fa-paint-brush" style="color:var(--p); margin-right:10px;"></i>Tùy chỉnh Ảnh nền (Version 16.0)</h3>
                                    <p style="font-size:14px; color:var(--sub); margin-bottom:20px;">Chọn ảnh nền có sẵn, dùng link online, hoặc tải ảnh từ máy của bạn.</p>
                                    
                                    <label style="font-size:13px; font-weight:700; margin-bottom:10px; display:block;">Gợi ý ảnh đẹp (Online):</label>
                                    <div style="display:grid; grid-template-columns: repeat(3, 1fr); gap:12px; margin-bottom:25px;">
                                        <div onclick="changeBg('https://images.unsplash.com/photo-1557683316-973673baf926')" style="height:80px; border-radius:12px; background:url('https://images.unsplash.com/photo-1557683316-973673baf926') center/cover; cursor:pointer; border:2px solid transparent; transition:0.3s;" onmouseover="this.style.borderColor='var(--p)'" onmouseout="this.style.borderColor='transparent'"></div>
                                        <div onclick="changeBg('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986')" style="height:80px; border-radius:12px; background:url('https://images.unsplash.com/photo-1534796636912-3b95b3ab5986') center/cover; cursor:pointer; border:2px solid transparent; transition:0.3s;" onmouseover="this.style.borderColor='var(--p)'" onmouseout="this.style.borderColor='transparent'"></div>
                                        <div onclick="changeBg('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b')" style="height:80px; border-radius:12px; background:url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b') center/cover; cursor:pointer; border:2px solid transparent; transition:0.3s;" onmouseover="this.style.borderColor='var(--p)'" onmouseout="this.style.borderColor='transparent'"></div>
                                    </div>

                                    <div style="border-top: 1px dashed var(--border); padding-top: 25px; margin-bottom: 25px;">
                                        <label style="font-size:13px; font-weight:700; margin-bottom:10px; display:block;"><i class="fas fa-upload" style="margin-right:5px;"></i>Tải ảnh từ máy tính của bạn:</label>
                                        
                                        <input type="file" id="bg-upload-input" accept="image/png, image/jpeg, image/jpg, image/gif" style="display:none" onchange="handleBgSelect(this)">
                                        
                                        <div style="display:flex; gap:15px; align-items:center;">
                                            <button class="btn btn-outline" onclick="document.getElementById('bg-upload-input').click()" style="flex:1; height: 45px;">
                                                <i class="fas fa-folder-open"></i> Chọn tệp ảnh...
                                            </button>
                                            
                                            <button class="btn btn-p" id="btn-save-bg" onclick="uploadBgFile()" style="flex:1; display:none; height: 45px;">
                                                <i class="fas fa-cloud-upload-alt"></i> Tải lên & Áp dụng
                                            </button>
                                        </div>
                                        <p id="bg-file-name" style="font-size:13px; color:var(--sub); margin-top:10px; font-style:italic; min-height: 20px;"></p>
                                    </div>
                                    <div style="display:flex; gap:15px;">
                                        <button class="btn btn-outline" style="flex:1;" onclick="changeBg('')"><i class="fas fa-link"></i> Nhập Link URL khác</button>
                                        <button class="btn btn-p" style="flex:1; background:var(--danger); color:white;" onclick="if(confirm('Bạn muốn đặt lại ảnh nền mặc định?')) changeBg('')"><i class="fas fa-trash-restore"></i> Xóa/Đặt lại mặc định</button>
                                    </div>
                                </div>

                                <div class="glass-card">
                                    <h3 style="margin-bottom:20px;"><i class="fas fa-info-circle" style="color:var(--p); margin-right:10px;"></i>Thông tin Hệ thống</h3>
                                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:15px;">
                                        <div style="background:var(--bg); padding:15px; border-radius:12px; border:1px solid var(--border);">
                                            <p style="color:var(--sub); font-size:12px;">Phiên bản</p>
                                            <p style="font-weight:700;">V16.0 (Ultra Custom)</p>
                                        </div>
                                        <div style="background:var(--bg); padding:15px; border-radius:12px; border:1px solid var(--border);">
                                            <p style="color:var(--sub); font-size:12px;">Trạng thái Server</p>
                                            <p style="font-weight:700; color:var(--success);">● Ổn định (Port ${PORT})</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div id="modal-book" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.8); z-index:1000; align-items:center; justify-content:center; backdrop-filter: blur(8px);">
                <div class="glass-cardanimate__animated animate__zoomIn animate__faster" style="width:450px; padding:35px;">
                    <div style="text-align:center; margin-bottom:25px;">
                        <div style="width:50px; height:50px; background:var(--p-soft); border-radius:50%; margin:0 auto 15px; display:flex; align-items:center; justify-content:center;"><i class="fas fa-calendar-plus" style="font-size:24px; color:var(--p);"></i></div>
                        <h2 style="margin-bottom:5px;">Xác nhận đặt lịch</h2>
                        <p style="font-size:14px; color:var(--sub);">Vui lòng kiểm tra kỹ thông tin trước khi gửi.</p>
                    </div>
                    
                    <div style="background:var(--bg); padding:15px; border-radius:12px; border:1px solid var(--border); margin-bottom:25px;">
                        <p style="font-size:13px; color:var(--sub);">Dịch vụ đã chọn:</p>
                        <b id="final-dv-name" style="color:var(--p); font-size:18px;"></b>
                    </div>
                    
                    <form action="/api/add-booking" method="POST">
                        <input type="hidden" name="dv" id="input-dv">
                        <div style="position:relative"><i class="fas fa-user-tag" style="position:absolute; left:15px; top:15px; color:var(--sub)"></i><input name="ten" placeholder="Tên người đặt / Liên hệ" required style="padding-left:45px;"></div>
                        <div style="position:relative"><i class="fas fa-phone" style="position:absolute; left:15px; top:15px; color:var(--sub)"></i><input name="sdt" placeholder="Số điện thoại liên lạc" required style="padding-left:45px;"></div>
                        <div style="position:relative"><i class="fas fa-clock" style="position:absolute; left:15px; top:15px; color:var(--sub)"></i><input type="datetime-local" name="tg" required style="padding-left:45px; color:var(--sub);"></div>
                        
                        <div style="display:grid; grid-template-columns: 1fr 1.5fr; gap:15px; margin-top:25px;">
                            <button type="button" class="btn btn-outline" onclick="closeM()">HỦY BỎ</button>
                            <button type="submit" class="btn btn-p">XÁC NHẬN ĐẶT LỊCH</button>
                        </div>
                    </form>
                </div>
            </div>

            <script>
                // Hàm chuyển tab (có hỗ trợ cập nhật URL)
                function tab(id) {
                    const url = new URL(window.location);
                    url.searchParams.set('tab', id);
                    window.history.pushState({}, '', url); // Cập nhật URL không reload
                    
                    // Ẩn tất cả tab và hiện tab được chọn
                    document.querySelectorAll('.tab-content').forEach(el => el.style.display = 'none');
                    document.getElementById(id).style.display = 'block';
                    
                    // Cập nhật trạng thái active trên sidebar
                    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
                    document.querySelector(\`.nav-item[onclick="tab('\${id}')"]\`).classList.add('active');
                }

                // Toggle dropdown menu
                function toggleDrop(event, id) {
                    event.stopPropagation();
                    const d = document.getElementById(id);
                    const isOpen = d.style.display === 'block';
                    document.querySelectorAll('.action-dropdown').forEach(el => el.style.display = 'none');
                    d.style.display = isOpen ? 'none' : 'block';
                }

                // Mở panel dịch vụ con
                function openSub(type) {
                    const panel = document.getElementById('sub-panel');
                    const options = document.getElementById('sub-options');
                    panel.style.display = 'block';
                    document.getElementById('sub-title').innerHTML = \`<i class="\${event.currentTarget.querySelector('i').className}" style="margin-right:10px;"></i> \${type}\`;
                    
                    let data = [];
                    if(type === 'Bóng đá') data = ['Sân 5 Cỏ nhân tạo', 'Sân 7 Cỏ nhân tạo', 'Sân 11 (Cỏ tự nhiên)', 'Thuê giày/áo đấu'];
                    if(type === 'Cầu lông') data = ['Sân đơn VIP', 'Sân đôi tiêu chuẩn', 'Thuê vợt/cầu', 'Thảm chuyên dụng'];
                    if(type === 'Spa') data = ['Massage Body đá nóng', 'Chăm sóc da mặt cơ bản', 'Gội đầu dưỡng sinh', 'Làm Nail & Mi'];
                    if(type === 'Karaoke') data = ['Phòng Thường (10 người)', 'Phòng VIP (20 người)', 'Phòng Super VIP (30+)', 'Combo Sinh Nhật'];
                    if(type === 'Y tế') data = ['Khám tổng quát', 'Khám Răng hàm mặt', 'Xét nghiệm máu', 'Tư vấn dinh dưỡng'];
                    if(type === 'Gym') data = ['Gói Gym 1 tháng', 'Gói Gym 3 tháng', 'Yoga Group Class', 'PT 1:1 Cao cấp'];

                    options.innerHTML = data.map(d => \`<button class="btn btn-outline" style="font-size:13px; padding: 12px; height: auto; white-space: normal;" onclick="openBooking('\${d}')">\${d}</button>\`).join('');
                    panel.scrollIntoView({behavior: 'smooth', block: 'nearest'});
                }

                // Mở modal đặt lịch
                function openBooking(dv) {
                    document.getElementById('modal-book').style.display = 'flex';
                    document.getElementById('final-dv-name').innerText = dv;
                    document.getElementById('input-dv').value = dv;
                }

                function closeM() { document.getElementById('modal-book').style.display = 'none'; }

                // Preview ảnh đại diện khi chọn file
                function preview(input) {
                    if (input.files && input.files[0]) {
                        var reader = new FileReader();
                        reader.onload = e => document.getElementById('pre-av').src = e.target.result;
                        reader.readAsDataURL(input.files[0]);
                    }
                }

                // Đồng hồ thời gian thực
                setInterval(() => {
                    const clock = document.getElementById('live-clock');
                    if(clock) clock.innerText = new Date().toLocaleTimeString('vi-VN', {hour12: false});
                }, 1000);

                // Đóng dropdown khi click ra ngoài
                window.onclick = () => document.querySelectorAll('.action-dropdown').forEach(d => d.style.display = 'none');
            </script>
        </body></html>`);
    } catch (e) { 
        res.send(`<script>alert('Lỗi kết nối Database: ${e.message}. Vui lòng kiểm tra lại cấu hình.'); window.location='/login';</script>`); 
    }
});

// --- API HẬU ĐÀI (BACKEND ENDPOINTS) ---

// Các route chỉ để redirect về trang chủ nếu truy cập trực tiếp
app.get(['/api/login', '/api/register', '/api/add-booking', '/api/update-profile', '/api/upload-bg'], (req, res) => res.redirect('/'));

// --- MỚI: API XỬ LÝ UPLOAD ẢNH NỀN TÙY CHỈNH (V16.0) ---
// Route này nhận file từ client, lưu vào thư mục uploads và trả về đường dẫn
app.post('/api/upload-bg', upload.single('bgFile'), (req, res) => {
    // Kiểm tra đăng nhập
    if (!req.session.user) {
        return res.status(401).json({ success: false, error: 'Phiên đăng nhập đã hết hạn.' });
    }

    if (req.file) {
        console.log(`[UPLOAD] User ${req.session.user.name} uploaded background: ${req.file.filename}`);
        // Trả về đường dẫn file vừa upload dưới dạng JSON cho frontend
        res.json({ 
            success: true, 
            path: '/uploads/' + req.file.filename,
            message: 'Upload thành công!'
        });
    } else {
        res.status(400).json({ success: false, error: 'Không có file nào được gửi lên hoặc lỗi định dạng.' });
    }
});
// --- KẾT THÚC API MỚI ---

// API Đăng ký
app.post('/api/register', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const check = await pool.request().input('u', sql.NVarChar, req.body.u).query("SELECT * FROM TaiKhoan WHERE TenDangNhap = @u");
        if(check.recordset.length > 0) {
            return res.send("<script>alert('Tên đăng nhập này đã tồn tại! Vui lòng chọn tên khác.'); window.history.back();</script>");
        }
        const hashed = await bcrypt.hash(req.body.p, saltRounds);
        await pool.request()
            .input('u', sql.NVarChar, req.body.u)
            .input('p', sql.NVarChar, hashed)
            // Sử dụng ảnh mặc định nếu chưa có
            .query("INSERT INTO TaiKhoan (TenDangNhap, MatKhau, AnhDaiDien) VALUES (@u, @p, '/uploads/default-avatar.png')");
        res.send("<script>alert('Đăng ký tài khoản thành công! Bạn có thể đăng nhập ngay.'); window.location='/login';</script>");
    } catch (e) { res.send(`<script>alert('Lỗi hệ thống: ${e.message}'); window.history.back();</script>`); }
});

// API Đăng nhập
app.post('/api/login', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        const result = await pool.request().input('u', sql.NVarChar, req.body.u).query("SELECT * FROM TaiKhoan WHERE TenDangNhap = @u");
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            const match = await bcrypt.compare(req.body.p, user.MatKhau.trim());
            if (match) {
                // Lưu session
                req.session.user = { name: user.TenDangNhap, avatar: user.AnhDaiDien || 'https://via.placeholder.com/150' };
                return res.redirect('/');
            }
        }
        res.send("<script>alert('Sai tên đăng nhập hoặc mật khẩu. Vui lòng thử lại!'); window.location='/login';</script>");
    } catch (e) { res.send(`<script>alert('Lỗi đăng nhập: ${e.message}'); window.location='/login';</script>`); }
});

// API Thêm lịch đặt mới
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
        // Redirect về tab quản lý lịch
        res.redirect('/?tab=book');
    } catch (e) { res.send(`<script>alert('Không thể lưu lịch đặt: ${e.message}'); window.history.back();</script>`); }
});

// API Xử lý hành động (Xác nhận/Hủy/Xóa)
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
    } catch (e) { res.send(`<script>alert('Lỗi thao tác: ${e.message}'); window.location='/?tab=book';</script>`); }
});

// API Cập nhật hồ sơ (Avatar & Mật khẩu)
app.post('/api/update-profile', upload.single('avatar'), async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    try {
        let pool = await sql.connect(dbConfig);
        let message = "Cập nhật hồ sơ thành công!";
        
        // 1. Xử lý đổi Avatar
        if (req.file) {
            let p = '/uploads/' + req.file.filename;
            await pool.request().input('av', sql.NVarChar, p).input('u', sql.NVarChar, req.session.user.name).query("UPDATE TaiKhoan SET AnhDaiDien = @av WHERE TenDangNhap = @u");
            req.session.user.avatar = p; // Cập nhật ngay trong session
        }
        
        // 2. Xử lý đổi Mật khẩu
        if (req.body.newpass) {
            if(req.body.newpass.length < 6) throw new Error("Mật khẩu mới phải từ 6 ký tự trở lên!");
            const h = await bcrypt.hash(req.body.newpass, saltRounds);
            await pool.request()
                .input('p', sql.NVarChar, h)
                .input('u', sql.NVarChar, req.session.user.name)
                .query("UPDATE TaiKhoan SET MatKhau = @p WHERE TenDangNhap = @u");
            message += " Mật khẩu đã được thay đổi.";
        }
        res.send(`<script>alert('${message}'); window.location='/?tab=prof';</script>`);
    } catch (e) { 
        res.send(`<script>alert('Lỗi cập nhật: ${e.message}'); window.location='/?tab=prof';</script>`); 
    }
});

// --- ĐĂNG XUẤT & KHỞI ĐỘNG ---

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/login');
});

// Khởi động server với thông báo ngầu hơn
app.listen(PORT, () => {
    console.log(`\n===================================================`);
    console.log(`🚀 WEB ĐẶT LỊCH V16.0 (ULTRA CUSTOM) - ĐÃ KÍCH HOẠT!`);
    console.log(`---------------------------------------------------`);
    console.log(`👉 Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`👉 Tính năng mới: Upload ảnh nền tùy chỉnh (Sẵn sàng)`);
    console.log(`===================================================\n`);
});