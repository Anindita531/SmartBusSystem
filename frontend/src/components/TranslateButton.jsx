import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

export default function TranslateButton() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentLang, setCurrentLang] = useState('EN');
  const scrollRef = useRef(null);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'bn', name: 'বাংলা', flag: '🇧🇩' },
    { code: 'hi', name: 'हिंदी', flag: '🇮🇳' },
    { code: 'ta', name: 'தமிழ்', flag: '🇮🇳' },
    { code: 'te', name: 'తెలుగు', flag: '🇮🇳' },
    { code: 'mr', name: 'मराठी', flag: '🇮🇳' },
    { code: 'gu', name: 'ગુજરાતી', flag: '🇮🇳' },
    { code: 'kn', name: 'ಕನ್ನಡ', flag: '🇮🇳' },
    { code: 'ml', name: 'മലയാളം', flag: '🇮🇳' },
    { code: 'pa', name: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
    { code: 'ur', name: 'اردو', flag: '🇵🇰' },
  ];

  useEffect(() => {
    // Google ke force kore load korabo
    const addScript = () => {
      if(window.google) return;
      const script = document.createElement('script');
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      document.head.appendChild(script);
    }

    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement({
        pageLanguage: 'en',
        includedLanguages: 'en,bn,hi,ta,te,mr,gu,kn,ml,pa,ur',
        autoDisplay: false
      }, 'google_translate_element');
    };
    addScript();

  }, []);

 const changeLanguage = (langCode) => {
  setIsOpen(false);
  
  const doTranslate = () => {
    const select = document.querySelector('.goog-te-combo');
    if(select) {
      select.value = langCode;
      select.dispatchEvent(new Event('change'));
      select.dispatchEvent(new Event('input'));
      setCurrentLang(langCode.toUpperCase());
    } else {
      // 500ms por abar try korbe. 10 bar porjonto
      setTimeout(doTranslate, 500);
    }
  }
  doTranslate();
};
  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: direction === 'left' ? -200 : 200, behavior: 'smooth' });
    }
  };

  return (
    <>
      <div id="google_translate_element" style={{display: 'none'}} />
      <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 999999 }}>
        <button onClick={() => setIsOpen(!isOpen)} style={{ background: '#1e293b', border: '1px solid #334155', padding: '8px 14px', borderRadius: '8px', cursor: 'pointer', color: '#f1f5f9', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🌍 {currentLang}
        </button>

        {isOpen && (
          <div style={{ position: 'absolute', top: '42px', right: '0', background: '#1e293b', border: '1px solid #334155', borderRadius: '12px', padding: '10px', width: '320px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button onClick={() => scroll('left')} style={{ flexShrink: 0, background: '#334155', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', color: '#f1f5f9' }}>‹</button>
              <div ref={scrollRef} style={{ display: 'flex', gap: '6px', overflowX: 'auto', scrollbarWidth: 'none' }}>
                {languages.map((lang) => (
                  <button key={lang.code} onClick={() => changeLanguage(lang.code)} style={{ flexShrink: 0, background: currentLang === lang.code.toUpperCase()? '#2563eb' : 'transparent', border: 'none', padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: '18px' }}>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => scroll('right')} style={{ flexShrink: 0, background: '#334155', border: 'none', borderRadius: '6px', width: '28px', height: '28px', cursor: 'pointer', color: '#f1f5f9' }}>›</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}