import{i as v,g as y,s as f,b as w}from"./creative_interactions-Clnxiw8v.js";const k=`<div class="landing-shell">
  <header class="landing-header">
    <a class="landing-brand" href="./" aria-label="InnoLab trang chủ"><span>IL</span><strong>InnoLab</strong></a>
    <nav aria-label="Điều hướng landing">
      <a href="#workspace">Không gian nghiên cứu</a>
      <button class="sound-toggle" type="button" data-sound-toggle aria-pressed="false">SOUND: OFF</button>
      <button class="gate-button gate-button-quiet" type="button" data-open-auth="login">Đăng nhập</button>
    </nav>
  </header>

  <main>
    <section class="landing-hero" aria-labelledby="landing-title">
      <div class="landing-copy">
        <p class="landing-kicker">RESEARCH WORKSPACE · 01</p>
        <h1 id="landing-title">INNO_<span>LAB</span></h1>
        <p class="landing-deck">RESEARCH / MADE TRACEABLE</p>
        <p class="landing-intro">InnoLab tập trung nhật ký thí nghiệm, dữ liệu gốc và tiến độ dự án STEM trong một không gian làm việc có thể kiểm tra và bàn giao.</p>
        <div class="landing-actions">
          <button class="gate-button gate-button-primary" type="button" data-open-auth="register">Bắt đầu ngay <span aria-hidden="true">↗</span></button>
          <button class="gate-button gate-button-outline" type="button" data-open-auth="login">Truy cập không gian làm việc</button>
        </div>
        <p class="landing-note">Đăng nhập hoặc tạo tài khoản để tiếp tục.</p>
      </div>

      <div class="record-preview" data-tilt aria-label="Minh họa bản ghi nghiên cứu">
        <div class="record-topline"><span>INNOLAB / FIELD RECORD</span><span>DEMO · 001</span></div>
        <div class="record-title"><span>THỬ NGHIỆM</span><strong>Độ ẩm và tốc độ nảy mầm</strong></div>
        <div class="record-meta"><span>BIẾN ĐỘC LẬP<strong>Độ ẩm đất</strong></span><span>LẦN ĐO<strong>01 — 12</strong></span></div>
        <div class="record-chart" aria-hidden="true">
          <div class="chart-axis"><span>12</span><span>08</span><span>04</span><span>00</span></div>
          <div class="chart-bars"><i style="--bar: 34%"></i><i style="--bar: 47%"></i><i style="--bar: 43%"></i><i style="--bar: 62%"></i><i style="--bar: 58%"></i><i style="--bar: 79%"></i><i style="--bar: 73%"></i><i style="--bar: 91%"></i></div>
          <div class="chart-labels"><span>NGÀY 01</span><span>NGÀY 08</span><span>NGÀY 12</span></div>
        </div>
        <div class="record-footer"><span><i></i> ĐÃ GHI NHẬN</span><span>WORM LOGBOOK</span></div>
      </div>
      <aside class="lab-note lab-note-one" data-tilt aria-label="Ghi chú thử nghiệm"><span>FIELD NOTE / A</span><strong>Quan sát trước.<br>Diễn giải sau.</strong><i>01° / 12°</i></aside>
      <aside class="lab-note lab-note-two" data-tilt aria-label="Dấu ghi nhật ký"><span>WORM STAMP</span><strong>ORIGINAL<br>RECORD</strong><i>SEALED · 2026</i></aside>
    </section>

    <section class="workspace-strip" id="workspace" aria-label="Các phần của không gian nghiên cứu">
      <article><span>01 / GHI CHÉP</span><h2>Nhật ký có dấu vết</h2><p>Lưu lại tiến trình và bối cảnh của từng lần thử nghiệm.</p></article>
      <article><span>02 / DỮ LIỆU</span><h2>Giữ nguyên dữ liệu gốc</h2><p>Tập hợp số liệu, tài liệu và tài nguyên nghiên cứu.</p></article>
      <article><span>03 / TIẾN ĐỘ</span><h2>Đưa kế hoạch vào việc</h2><p>Theo dõi giai đoạn, phân công và các mốc tiếp theo.</p></article>
    </section>
  </main>

  <footer class="landing-footer"><span>INNOLAB DASHBOARD</span><span>Không gian làm việc dành cho nghiên cứu STEM.</span></footer>
</div>`,L=`<div class="auth-modal" data-auth-modal hidden>
  <button class="auth-backdrop" type="button" data-close-auth aria-label="Đóng cửa sổ xác thực"></button>
  <section class="auth-dialog" data-tilt role="dialog" aria-modal="true" aria-labelledby="auth-title" tabindex="-1">
    <header class="auth-heading">
      <div><p class="landing-kicker">LOCAL AUTH TERMINAL / 01</p><h2 id="auth-title">Chào mừng trở lại</h2></div>
      <button class="auth-close" type="button" data-close-auth aria-label="Đóng">×</button>
    </header>
    <div class="auth-tabs" role="tablist" aria-label="Loại tài khoản">
      <button type="button" role="tab" aria-selected="true" data-auth-mode="login">Đăng nhập</button>
      <button type="button" role="tab" aria-selected="false" data-auth-mode="register">Tạo tài khoản</button>
    </div>
    <form class="auth-form" data-auth-form>
      <label data-auth-name-field hidden>Họ tên<input name="name" autocomplete="name" placeholder="Tên của bạn"></label>
      <label>Email<input name="email" type="email" autocomplete="email" required placeholder="ten@donvi.edu.vn"></label>
      <label>Mật khẩu<input name="password" type="password" autocomplete="current-password" minlength="8" required placeholder="Tối thiểu 8 ký tự"></label>
      <label data-auth-confirm-field hidden>Xác nhận mật khẩu<input name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" placeholder="Nhập lại mật khẩu"></label>
      <p class="auth-error" data-auth-error role="alert" aria-live="polite"></p>
      <button class="gate-button gate-button-primary auth-submit" type="submit" data-auth-submit>Đăng nhập <span aria-hidden="true">↗</span></button>
    </form>
    <p class="auth-privacy">Thông tin tài khoản được xác thực qua PocketBase của workspace này.</p>
  </section>
</div>`;async function E(n){if(n.innerHTML=`${k}${L}`,v(n),await y()){window.location.replace(new URL("./dashboard.html",window.location.href));return}const r=n.querySelector("[data-auth-modal]"),e=n.querySelector("[data-auth-form]"),p=n.querySelector("[data-auth-name-field]"),u=e.elements.name,g=e.elements.password,m=n.querySelector("[data-auth-confirm-field]"),b=e.elements.passwordConfirm,i=n.querySelector("[data-auth-submit]"),l=n.querySelector("[data-auth-error]");let s="login";const d=t=>{s=t;const a=s==="register";p.hidden=!a,u.required=a,m.hidden=!a,b.required=a,g.autocomplete=a?"new-password":"current-password",i.innerHTML=a?'Tạo tài khoản <span aria-hidden="true">↗</span>':'Đăng nhập <span aria-hidden="true">↗</span>',n.querySelectorAll("[data-auth-mode]").forEach(o=>{o.setAttribute("aria-selected",String(o.dataset.authMode===s))}),l.textContent="",n.querySelector("#auth-title").textContent=a?"Tạo không gian của bạn":"Chào mừng trở lại"},c=()=>{r.hidden=!0,document.body.classList.remove("auth-open")};n.querySelectorAll("[data-open-auth]").forEach(t=>t.addEventListener("click",()=>{d(t.dataset.openAuth),r.hidden=!1,document.body.classList.add("auth-open"),requestAnimationFrame(()=>e.elements.email.focus())})),n.querySelectorAll("[data-close-auth]").forEach(t=>t.addEventListener("click",c)),n.querySelectorAll("[data-auth-mode]").forEach(t=>t.addEventListener("click",()=>d(t.dataset.authMode))),document.addEventListener("keydown",t=>{t.key==="Escape"&&!r.hidden&&c()}),e.addEventListener("submit",async t=>{t.preventDefault(),l.textContent="",i.disabled=!0,i.textContent=s==="register"?"Đang tạo tài khoản...":"Đang xác thực...";try{const a=new FormData(e);if(s==="register"){const o=a.get("password");if(o!==a.get("passwordConfirm"))throw new Error("Mật khẩu xác nhận chưa khớp.");await f({name:a.get("name"),email:a.get("email"),password:o,passwordConfirm:a.get("passwordConfirm")})}else await w(a.get("email"),a.get("password"));window.location.assign(new URL("./dashboard.html",window.location.href))}catch(a){l.textContent=a instanceof Error?a.message:"Không thể xác thực tài khoản.",i.innerHTML=s==="register"?'Tạo tài khoản <span aria-hidden="true">↗</span>':'Đăng nhập <span aria-hidden="true">↗</span>',i.disabled=!1}})}const h=document.querySelector("#app");E(h).catch(n=>{h.innerHTML=`<main class="gate-failure"><h1>Không thể mở InnoLab</h1><p>${n instanceof Error?n.message:"Vui lòng tải lại trang."}</p></main>`});
