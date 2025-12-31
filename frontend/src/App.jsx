import { defineComponent, ref, onMounted } from 'vue';
import api from './api';

export default defineComponent({
  setup() {
    const links = ref([]);
    const isLogged = ref(!!localStorage.getItem('token'));
    const showLogin = ref(false);
    const isDark = ref(localStorage.getItem('theme') === 'dark');
    const form = ref({ username: '', password: '', title: '', url: '' });

    const toggleTheme = () => {
      isDark.value = !isDark.value;
      const theme = isDark.value ? 'dark' : 'light';
      document.documentElement.setAttribute('data-theme', theme);
      localStorage.setItem('theme', theme);
    };

    const loadLinks = async () => {
      try {
        const { data } = await api.get('/links');
        links.value = data;
      } catch (e) { console.error("API_OFFLINE", e); }
    };

    const login = async () => {
      try {
        const { data } = await api.post('/login', { 
            username: form.value.username, 
            password: form.value.password 
        });
        localStorage.setItem('token', data.token);
        isLogged.value = true;
        showLogin.value = false;
        loadLinks(); // Rafraîchit après connexion
      } catch (e) { alert("Accès refusé"); }
    };

    const logout = () => {
      localStorage.removeItem('token');
      isLogged.value = false;
      window.location.reload(); // Propre pour réinitialiser l'état
    };

    const addLink = async () => {
      if (!form.value.title || !form.value.url) return;
      await api.post('/links', { title: form.value.title, url: form.value.url });
      form.value.title = ''; form.value.url = '';
      loadLinks();
    };

    const deleteLink = async (id) => {
      await api.delete(`/links/${id}`);
      loadLinks();
    };

    onMounted(() => {
      loadLinks();
      document.documentElement.setAttribute('data-theme', isDark.value ? 'dark' : 'light');
    });

    return () => (
      <div class="app-wrapper">
        <div class="sakura" style="left: 5%; animation-duration: 7s;">🌸</div>
        <div class="sakura" style="left: 25%; animation-duration: 12s;">🌸</div>
        <div class="sakura" style="left: 55%; animation-duration: 9s;">🌸</div>
        <div class="sakura" style="left: 85%; animation-duration: 15s;">🌸</div>

        <div class="app-frame">
          <nav class="top-nav">
            <button class="theme-toggle" onClick={toggleTheme}>
              {isDark.value ? '☀️' : '🌙'}
            </button>

            {/* BOUTON DYNAMIQUE CONNEXION / QUITTER */}
            {!isLogged.value ? (
              <button class="auth-trigger" onClick={() => { showLogin.value = !showLogin.value }}>
                {showLogin.value ? '閉じる (FERMER)' : '鍵 (ENTRER)'}
              </button>
            ) : (
              <button class="auth-trigger logout-style" onClick={logout}>
                終了 (QUITTER)
              </button>
            )}
          </nav>

          <header class="profile-header">
            <div class="avatar-hinomaru">
              <span>道</span> 
            </div>
            <h1>Jules Benoit</h1>
            <p style={{ color: isDark.value ? '#aaa' : '#888', letterSpacing: '3px', fontSize: '0.8rem' }}>
                静かな道
            </p>
          </header>

          {/* Formulaire de Login */}
          {showLogin.value && !isLogged.value && (
            <div class="admin-panel" style="margin-bottom: 40px">
              <input 
                value={form.value.username} 
                onInput={(e) => form.value.username = e.target.value} 
                placeholder="USER" 
              />
              <input 
                value={form.value.password} 
                onInput={(e) => form.value.password = e.target.value} 
                type="password" 
                placeholder="PASS" 
              />
              <button class="btn-add" onClick={login}>VALIDER</button>
            </div>
          )}

          <div class="links-grid">
            {links.value.map(link => (
              <div class="cyber-card" key={link._id}>
                <a href={link.url} target="_blank" class="link-label">
                  {link.title}
                </a>
                {isLogged.value && (
                  <button class="btn-delete" onClick={() => deleteLink(link._id)}>×</button>
                )}
              </div>
            ))}
          </div>

          {isLogged.value && (
            <footer class="admin-panel">
              <input 
                value={form.value.title} 
                onInput={(e) => form.value.title = e.target.value} 
                placeholder="NOM" 
              />
              <input 
                value={form.value.url} 
                onInput={(e) => form.value.url = e.target.value} 
                placeholder="URL" 
              />
              <button class="btn-add" onClick={addLink}>AJOUTER</button>
            </footer>
          )}
        </div>
      </div>
    );
  }
});