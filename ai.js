// Yapay zekâ (Google Gemini): anahtar kurulumu, fotoğraftan kalori, sesle/yazarak anlatma, yapay zekâya sorma.
(function () {
  'use strict';
  var A = App, V = A.V, esc = A.esc, ik = A.ik, sayi = A.sayi, $ = A.$;

  // ---------- Gemini istemcisi ----------
  function anahtarVar() { return !!V().ayarlar.geminiAnahtar; }

  function hataMetni(durum, mesaj) {
    mesaj = String(mesaj || '');
    if (durum === 400 && /api key/i.test(mesaj)) return 'Anahtar geçersiz. Profil > Yapay zekâ bölümünden anahtarı kontrol et.';
    if (durum === 400) return 'Gemini isteği anlayamadı: ' + mesaj.slice(0, 120);
    if (durum === 403) return 'Bu anahtarın izni yok. Yeni bir anahtar oluşturmayı dene.';
    if (durum === 429) return 'Ücretsiz kullanım sınırı doldu. Bir dakika bekleyip tekrar dene (günlük sınır dolduysa yarın).';
    if (durum >= 500) return 'Gemini şu an yoğun. Biraz sonra tekrar dene.';
    return 'Yapay zekâ hatası (' + durum + '): ' + mesaj.slice(0, 120);
  }

  function jsonAyikla(metin) {
    var t = String(metin || '').replace(/```json|```/g, '').trim();
    var a = t.indexOf('{'), b = t.lastIndexOf('}');
    if (a < 0 || b < a) throw new Error('Yapay zekâ beklenen biçimde cevap vermedi. Tekrar dene.');
    return JSON.parse(t.slice(a, b + 1));
  }

  function modeller() {
    var l = [V().ayarlar.geminiModel || 'gemini-flash-latest', 'gemini-flash-latest', 'gemini-2.5-flash'];
    return l.filter(function (m, i) { return m && l.indexOf(m) === i; });
  }

  // parts: [{text}, {inline_data:{mime_type,data}}] -> Promise(JSON nesnesi)
  function istek(parts, sicaklik) {
    var anahtar = V().ayarlar.geminiAnahtar;
    if (!anahtar) return Promise.reject(new Error('Önce Profil > Yapay zekâ bölümünden Gemini anahtarını gir.'));
    var govde = JSON.stringify({
      contents: [{ role: 'user', parts: parts }],
      generationConfig: { responseMimeType: 'application/json', temperature: sicaklik == null ? 0.3 : sicaklik }
    });
    var ml = modeller();
    function dene(i) {
      var ctrl = window.AbortController ? new AbortController() : null;
      var zaman = setTimeout(function () { if (ctrl) ctrl.abort(); }, 60000);
      return fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(ml[i]) + ':generateContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': anahtar }, body: govde,
        signal: ctrl ? ctrl.signal : undefined
      }).then(function (r) {
        clearTimeout(zaman);
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (r.status === 404 && i + 1 < ml.length) return dene(i + 1);
          if (!r.ok) throw new Error(hataMetni(r.status, j.error && j.error.message));
          var c = j.candidates && j.candidates[0];
          var metin = c && c.content && c.content.parts ? c.content.parts.map(function (p) { return p.text || ''; }).join('') : '';
          if (!metin) throw new Error('Yapay zekâ boş cevap verdi' + (c && c.finishReason ? ' (' + c.finishReason + ')' : '') + '. Tekrar dene.');
          return jsonAyikla(metin);
        });
      }, function (e) {
        clearTimeout(zaman);
        throw new Error(e && e.name === 'AbortError' ? 'Cevap çok gecikti. Tekrar dene.' : 'İnternete ulaşılamadı. Bağlantını kontrol et.');
      });
    }
    return dene(0);
  }

  // Fotoğrafı küçült (en uzun kenar 1024 px) ve base64 yap
  function resimHazirla(dosya) {
    return new Promise(function (ok, red) {
      var url = URL.createObjectURL(dosya);
      var img = new Image();
      img.onload = function () {
        var en = img.naturalWidth, boy = img.naturalHeight, max = 1024;
        var o = Math.min(1, max / Math.max(en, boy));
        var c = document.createElement('canvas');
        c.width = Math.round(en * o); c.height = Math.round(boy * o);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        URL.revokeObjectURL(url);
        var d = c.toDataURL('image/jpeg', 0.82);
        ok({ dataUrl: d, b64: d.split(',')[1] });
      };
      img.onerror = function () { URL.revokeObjectURL(url); red(new Error('Fotoğraf açılamadı.')); };
      img.src = url;
    });
  }

  window.YZ = { anahtarVar: anahtarVar, istek: istek, resimHazirla: resimHazirla };

  // ---------- yemek tanıma ----------
  var SEMA = '{"yemekler":[{"ad":"Türkçe kısa ad","birim":"porsiyon","adet":1,"gram":250,"k100":120,"p100":5,"c100":15,"f100":4}],"not":"kısa Türkçe not"}';
  var KURAL = 'Kurallar: Türk mutfağını ve Türkiye\'deki ev porsiyonlarını dikkate al. "birim" doğal bir ölçü olsun (porsiyon, kase, adet, dilim, bardak, yemek kaşığı, tabak) ya da "g". ' +
    '"adet" o birimden kaç tane olduğu, "gram" toplam gramdır (içeceklerde ml ≈ g). k100, p100, c100, f100: 100 gram için kcal, protein, karbonhidrat, yağ. ' +
    'Gerçekçi ve tutarlı değerler ver. Yalnızca bu şemada JSON döndür: ' + SEMA;

  function fotoIste(b64) {
    return istek([
      { text: 'Bu fotoğraftaki yiyecek ve içecekleri tek tek tanı, her birinin miktarını tabak/kap boyutuna göre tahmin et. ' + KURAL + ' Fotoğrafta yiyecek yoksa "yemekler" boş liste olsun ve "not" alanında açıkla.' },
      { inline_data: { mime_type: 'image/jpeg', data: b64 } }
    ]);
  }
  function metinIste(metin) {
    return istek([{ text: 'Kullanıcı yediklerini şöyle anlattı: "' + metin.replace(/"/g, "'") + '". Anlatılan her yiyecek ve içeceği ayrı kalem olarak çıkar; miktar söylenmediyse normal bir porsiyon varsay. ' + KURAL }]);
  }

  function listeDuzenle(j) {
    return (j.yemekler || []).map(function (y) {
      var adet = Number(y.adet) > 0 ? Number(y.adet) : 1;
      var gram = Number(y.gram) > 0 ? Number(y.gram) : 100;
      var birim = String(y.birim || 'porsiyon').trim();
      if (/^(g|gr|gram|ml)$/i.test(birim)) { birim = 'g'; adet = gram; }
      return {
        sec: true, ad: String(y.ad || 'Yemek').trim(), birim: birim, adet: adet, gpu: birim === 'g' ? 1 : gram / adet,
        k: Math.max(0, Math.round(Number(y.k100) || 0)), p: Hesap.yuvarla(Number(y.p100) || 0), c: Hesap.yuvarla(Number(y.c100) || 0), f: Hesap.yuvarla(Number(y.f100) || 0)
      };
    }).filter(function (y) { return y.ad; });
  }

  function calistir(s, soz) {
    s.durum = 'yukleniyor'; s.hata = '';
    A.renderSheet();
    soz().then(function (j) {
      if (A.S.sheet !== s) return;
      s.liste = listeDuzenle(j); s.not = j.not || ''; s.durum = 'hazir';
      A.renderSheet();
    }).catch(function (e) {
      if (A.S.sheet !== s) return;
      s.durum = 'hata'; s.hata = e.message; A.renderSheet();
    });
  }

  function kalemKcal(y) { return Math.round(y.k * y.gpu * y.adet / 100); }
  window.YZ.KURAL = KURAL;
  window.YZ.listeDuzenle = listeDuzenle;
  window.YZ.kalemKcal = kalemKcal;
  // yapay zekâ kalemini günlüğe yazar
  window.YZ.kalemEkle = function (y, ogun) {
    var yem = { ad: y.ad, k: y.k, p: y.p, c: y.c, f: y.f, kaynak: 'ai', birimler: y.birim === 'g' ? [] : [{ ad: y.birim, g: Math.max(1, Math.round(y.gpu)) }] };
    A.kayitYaz(yem, ogun, y.birim, y.adet);
  };

  A.sheetler.aiSonuc = function (s) {
    var h = A.basHtml(s.baslik || 'Yapay zekâ', 'geri') + '<div class="sheet-govde">';
    if (s.resim) h += '<img class="ai-resim" src="' + s.resim + '" alt="">';
    if (s.metin) h += '<p class="ai-metin">“' + esc(s.metin) + '”</p>';
    if (s.durum === 'yukleniyor') {
      h += '<div class="yukleniyor"><span class="donen"></span>Yapay zekâ inceliyor…</div>';
    } else if (s.durum === 'hata') {
      h += '<div class="bos"><span class="em">⚠️</span>' + esc(s.hata) + '</div><button class="dugme ikincil" data-a="aiTekrar">Tekrar dene</button>';
    } else if (s.durum === 'hazir') {
      if (!s.liste.length) {
        h += '<div class="bos"><span class="em">🤔</span>' + esc(s.not || 'Yiyecek bulunamadı.') + '</div>';
      } else {
        h += '<div class="liste">';
        s.liste.forEach(function (y, i) {
          h += '<div class="ai-satir' + (y.sec ? '' : ' kapali') + '"><button class="kutu' + (y.sec ? ' secili' : '') + '" data-a="aiSec" data-v="' + i + '" aria-label="Seç">' + ik('tik') + '</button>' +
            '<div class="ad"><b>' + esc(y.ad) + '</b><span><input class="ai-adet" type="text" inputmode="decimal" data-g="aiAdet" data-v="' + i + '" value="' + String(Math.round(y.adet * 10) / 10).replace('.', ',') + '"> ' +
            esc(y.birim === 'g' ? 'gram' : y.birim) + (y.birim !== 'g' ? ' (' + Math.round(y.gpu * y.adet) + ' g)' : '') + '</span></div>' +
            '<span class="kcal" id="aiK' + i + '">' + kalemKcal(y) + '</span></div>';
        });
        h += '</div><div class="ai-toplam">Toplam <b id="aiToplam">' + sayi(toplam(s)) + ' kcal</b></div>';
        if (s.not) h += '<p class="ipucu">' + esc(s.not) + '</p>';
        h += '<p class="ipucu">⚠️ Bu bir tahmindir. Miktarları kontrol edip gerekirse düzelt.</p>';
        h += '<div class="ogun-sec">' + A.OGUNLER.map(function (o) {
          return '<button class="' + (s.ogun === o.id ? 'secili' : '') + '" data-a="ogunSec" data-v="' + o.id + '">' + o.em + ' ' + o.ad + '</button>';
        }).join('') + '</div>';
      }
    }
    h += '</div>';
    if (s.durum === 'hazir' && s.liste.length) h += '<div class="sheet-alt"><button class="dugme" data-a="aiEkle">Seçilenleri ekle</button></div>';
    return h;
  };
  function toplam(s) {
    var t = 0;
    s.liste.forEach(function (y) { if (y.sec) t += kalemKcal(y); });
    return t;
  }

  A.giris.aiAdet = function (el) {
    var s = A.S.sheet, i = Number(el.dataset.v), y = s.liste[i], x = A.oku(el.value);
    if (!(x > 0)) return;
    y.adet = x;
    $('aiK' + i).textContent = kalemKcal(y);
    $('aiToplam').textContent = sayi(toplam(s)) + ' kcal';
  };

  // ---------- anahtar kurulumu ----------
  A.kisa.yzAyar = 1;
  A.sheetler.yzAyar = function (s) {
    var a = V().ayarlar;
    var h = A.basHtml('Yapay zekâ kurulumu', s.geri ? 'geri' : 'kapat') + '<div class="sheet-govde">';
    h += '<p class="ipucu">Fotoğraftan kalori, sesle ekleme, tarif üretme ve öğün planı için ücretsiz bir Google Gemini anahtarı gerekiyor. Bir kez yapman yeterli:</p>' +
      '<ol class="adimlar"><li>Aşağıdaki düğmeyle Google AI Studio\'yu aç, Gmail hesabınla giriş yap.</li>' +
      '<li><b>Create API key</b> (API anahtarı oluştur) düğmesine bas.</li>' +
      '<li>Çıkan <b>AIza…</b> ile başlayan yazıyı kopyala, buraya yapıştır.</li></ol>' +
      '<a class="dugme ikincil" href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio\'yu aç</a>';
    h += '<div class="form-alan" style="margin-top:16px"><label for="yzAnahtar">Gemini anahtarı</label><input id="yzAnahtar" type="text" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" placeholder="AIza..." value="' + esc(a.geminiAnahtar) + '"></div>';
    if (navigator.clipboard && navigator.clipboard.readText) h += '<button class="dugme ikincil" data-a="yzYapistir" style="margin-bottom:10px">📋 Panodan yapıştır</button>';
    h += '<details class="ileri"><summary>Gelişmiş</summary><div class="form-alan"><label for="yzModel">Model adı</label><input id="yzModel" type="text" autocapitalize="off" value="' + esc(a.geminiModel) + '"></div></details>';
    h += '<p class="hata" id="yzDurum" style="text-align:left"></p>';
    h += '<button class="dugme" data-a="yzKaydet">Kaydet ve dene</button>';
    if (a.geminiAnahtar) h += '<button class="dugme tehlike" data-a="yzSil">Anahtarı sil</button>';
    h += '<p class="ipucu" style="margin-top:14px">Anahtar yalnızca bu telefonda saklanır. Google ücretsiz kullanımda gönderilen fotoğraf ve metinleri kendi yapay zekâsını geliştirmek için kullanabilir.</p></div>';
    return h;
  };

  // yapay zekâ gerektiren işlemler için ortak kapı
  function yzGerekli(devam) {
    if (anahtarVar()) { devam(); return; }
    var yeni = { tur: 'yzAyar' };
    if (A.S.sheet) A.sheetGec(yeni); else { A.S.sheet = yeni; A.sheetAc(); }
    A.toast('Önce yapay zekâyı kur');
  }
  window.YZ.gerekli = yzGerekli;

  // ---------- sesle / yazarak anlatma ----------
  var tanima = null;
  function tanimaDurdur() { if (tanima) { try { tanima.stop(); } catch (e) {} tanima = null; } }
  A.kapanis.push(function (s) { if (s && s.tur === 'anlat') tanimaDurdur(); });

  A.kisa.anlat = 1;
  A.sheetler.anlat = function (s) {
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var h = A.basHtml('Sesle ekle', 'geri') + '<div class="sheet-govde">';
    h += '<p class="ipucu">Ne yediğini anlat: ör. "2 dilim ekmek, 1 kase mercimek çorbası ve bir bardak ayran".</p>';
    h += '<textarea id="anlatMetin" rows="4" placeholder="Yediklerini yaz ya da konuş…">' + esc(s.metin || '') + '</textarea>';
    if (SR) h += '<button class="mik-dugme' + (s.dinliyor ? ' aktif' : '') + '" data-a="dinle">' + ik('mik') + (s.dinliyor ? 'Dinliyorum… bitince dokun' : 'Konuşmak için dokun') + '</button>';
    else h += '<p class="ipucu">🎤 Klavyedeki mikrofon tuşuna basarak da konuşabilirsin.</p>';
    h += '<button class="dugme" data-a="anlatGonder" style="margin-top:12px">' + ik('yz') + ' Yapay zekâ hesaplasın</button></div>';
    return h;
  };
  A.giris.anlatMetin = function (el) { A.S.sheet.metin = el.value; };

  // ---------- olaylar ----------
  var aks = A.aks;
  aks.yzAyar = function () { A.S.sheet = { tur: 'yzAyar' }; A.sheetAc(); };
  aks.yzKaydet = function () {
    var a = V().ayarlar, d = $('yzDurum');
    var k = $('yzAnahtar').value.trim(), m = $('yzModel').value.trim() || 'gemini-flash-latest';
    if (!k) { d.textContent = 'Anahtarı yapıştır.'; return; }
    a.geminiAnahtar = k; a.geminiModel = m; A.kaydet();
    d.style.color = 'var(--soluk)'; d.textContent = 'Deneniyor…';
    istek([{ text: 'Sadece şu JSON\'u döndür: {"tamam":true}' }]).then(function () {
      d.style.color = 'var(--ana)'; d.textContent = '✅ Çalışıyor! Yapay zekâ özellikleri açıldı.';
      A.render();
      setTimeout(function () { if (A.S.sheet && A.S.sheet.tur === 'yzAyar') aks.geri(); }, 1200);
    }).catch(function (e) { d.style.color = ''; d.textContent = e.message; });
  };
  aks.yzYapistir = function () {
    navigator.clipboard.readText().then(function (t) {
      var m = String(t || '').match(/AIza[0-9A-Za-z_\-]{20,}/);
      var d = $('yzDurum');
      if (!m) { d.style.color = ''; d.textContent = 'Panoda Gemini anahtarı bulunamadı. Önce anahtarı kopyala (AIza ile başlar).'; return; }
      $('yzAnahtar').value = m[0];
      aks.yzKaydet();
    }).catch(function () { A.toast('Panoya erişilemedi. Kutuya basılı tutup "Yapıştır" de.'); });
  };
  aks.yzSil = function () {
    if (!confirm('Gemini anahtarı bu telefondan silinsin mi?')) return;
    V().ayarlar.geminiAnahtar = ''; A.kaydet(); A.sheetKapat(); A.render();
  };

  aks.foto = function () {
    yzGerekli(function () {
      A.S.fotoOgun = A.S.sheet ? A.S.sheet.ogun : 'ogle';
      var g = $('fotoGiris'); g.value = ''; g.click();
    });
  };
  A.degisim.fotoGiris = function (el) {
    var f = el.files && el.files[0];
    if (!f) return;
    var s = { tur: 'aiSonuc', baslik: 'Fotoğraftan tahmin', ogun: A.S.fotoOgun || 'ogle', durum: 'yukleniyor', liste: [] };
    if (A.S.sheet) A.sheetGec(s); else { A.S.sheet = s; A.sheetAc(); }
    resimHazirla(f).then(function (r) {
      s.resim = r.dataUrl;
      s.yeniden = function () { return fotoIste(r.b64); };
      calistir(s, s.yeniden);
    }).catch(function (e) { s.durum = 'hata'; s.hata = e.message; A.renderSheet(); });
  };

  aks.anlat = function () {
    yzGerekli(function () { A.sheetGec({ tur: 'anlat', ogun: A.S.sheet.ogun, metin: '' }); });
  };
  aks.dinle = function () {
    var s = A.S.sheet;
    if (tanima) { tanimaDurdur(); s.dinliyor = false; A.renderSheet(); return; }
    var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    var r = new SR(), bas = (s.metin || '').trim();
    r.lang = 'tr-TR'; r.interimResults = true; r.continuous = true;
    r.onresult = function (e) {
      var t = '';
      for (var i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      s.metin = (bas ? bas + ' ' : '') + t.trim();
      var el = $('anlatMetin'); if (el) el.value = s.metin;
    };
    r.onerror = function (e) {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') A.toast('Mikrofon izni verilmedi. Klavyedeki mikrofonu kullanabilirsin.');
    };
    r.onend = function () { tanima = null; s.dinliyor = false; if (A.S.sheet === s) A.renderSheet(); };
    try { r.start(); tanima = r; s.dinliyor = true; A.renderSheet(); }
    catch (e) { A.toast('Ses tanıma başlatılamadı. Klavyedeki mikrofonu kullan.'); }
  };
  aks.anlatGonder = function () {
    var s = A.S.sheet, m = (s.metin || '').trim();
    if (!m) { A.toast('Önce ne yediğini anlat'); return; }
    tanimaDurdur();
    var y = { tur: 'aiSonuc', baslik: 'Anlattıkların', ogun: s.ogun, metin: m, durum: 'yukleniyor', liste: [] };
    y.yeniden = function () { return metinIste(m); };
    A.sheetGec(y);
    calistir(y, y.yeniden);
  };
  aks.yzSor = function () {
    var q = (A.S.sheet.q || '').trim();
    if (!q) return;
    yzGerekli(function () {
      var y = { tur: 'aiSonuc', baslik: 'Yapay zekâya sor', ogun: A.S.sheet.ogun, metin: q, durum: 'yukleniyor', liste: [] };
      y.yeniden = function () { return metinIste(q); };
      A.sheetGec(y);
      calistir(y, y.yeniden);
    });
  };
  aks.aiTekrar = function () { var s = A.S.sheet; if (s.yeniden) calistir(s, s.yeniden); };
  aks.aiSec = function (el) {
    var s = A.S.sheet, y = s.liste[Number(el.dataset.v)];
    y.sec = !y.sec;
    el.classList.toggle('secili', y.sec);
    el.parentNode.classList.toggle('kapali', !y.sec);
    $('aiToplam').textContent = sayi(toplam(s)) + ' kcal';
  };
  aks.aiEkle = function () {
    var s = A.S.sheet, n = 0;
    s.liste.forEach(function (y) {
      if (!y.sec) return;
      window.YZ.kalemEkle(y, s.ogun);
      n++;
    });
    if (!n) { A.toast('Hiçbiri seçili değil'); return; }
    A.render(); A.sheetKapat();
    A.toast(n + ' kalem eklendi');
  };
})();
