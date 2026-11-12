(function () {
  'use strict';

  var SURUM = '0.1';

  Depo.yukle();
  function V() { return Depo.v; }

  var OGUNLER = [
    { id: 'kahvalti', ad: 'Kahvaltı', em: '☕' },
    { id: 'ogle', ad: 'Öğle yemeği', em: '🥗' },
    { id: 'aksam', ad: 'Akşam yemeği', em: '🍲' },
    { id: 'ara', ad: 'Ara öğün', em: '🍎' }
  ];
  var AYLAR = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
  var GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
  var HEDEF_AD = { ver: 'Kilo vermek', koru: 'Kilomu korumak', al: 'Kilo almak' };
  var MAKRO_VARSAYILAN = { c: 45, p: 25, f: 30 };

  var S = { sekme: 'gunluk', tarih: bugun(), kur: null, sheet: null, reg: [] };

  // ---------- yardımcılar ----------
  var IK = {
    gunluk: 'M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z M5 17a3 3 0 0 1 3-3h11 M9 8h6',
    oruc: 'M12 21a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M12 9v4l2.5 2 M10 2h4',
    tarif: 'M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6z M2 11h20 M9 7.5c0-1.5 1-2 1-3.5 M14 7.5c0-1.5 1-2 1-3.5',
    ilerleme: 'M4 19h16 M6 15l4-5 3 3 5-7',
    profil: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4 21a8 8 0 0 1 16 0',
    arti: 'M12 5v14 M5 12h14',
    ara: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14z M21 21l-5-5',
    kamera: 'M4 8h3l2-3h6l2 3h3v11H4z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    barkod: 'M3 7V5h3 M18 5h3v2 M21 17v2h-3 M6 19H3v-2 M7 8v8 M10 8v8 M13 8v8 M16 8v8',
    mik: 'M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z M6 11a6 6 0 0 0 12 0 M12 17v4',
    kalem: 'M4 20h4L19 9l-4-4L4 16z M14 6l4 4',
    yildiz: 'M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z',
    sol: 'M15 5l-7 7 7 7',
    sag: 'M9 5l7 7-7 7',
    kapat: 'M6 6l12 12 M18 6L6 18',
    cop: 'M4 7h16 M9 7V4h6v3 M6 7l1 13h10l1-13',
    indir: 'M12 4v11 M7 10l5 5 5-5 M5 20h14',
    yukle: 'M12 20V9 M7 14l5-5 5 5 M5 4h14',
    damla: 'M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z',
    hedef: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 16a4 4 0 1 0 0-8 4 4 0 0 0 0 8z'
  };
  function ik(ad, cls) {
    return '<svg class="ikon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true"><path d="' + IK[ad] + '"/></svg>';
  }
  var BARDAK = '<svg viewBox="0 0 34 42" aria-hidden="true"><path d="M4 3h26l-3.2 34a3 3 0 0 1-3 2.7H10.2a3 3 0 0 1-3-2.7z" fill="currentColor" opacity=".9"/><path d="M8.5 12h17" stroke="#fff" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/></svg>';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function sayi(x, ondalik) {
    if (x == null || isNaN(x)) return '0';
    var n = ondalik ? Math.round(x * 10) / 10 : Math.round(x);
    return n.toLocaleString('tr-TR');
  }
  function litre(ml) { return (ml / 1000).toLocaleString('tr-TR', { maximumFractionDigits: 2 }); }
  function oku(s) { return parseFloat(String(s == null ? '' : s).replace(',', '.')); }
  function bugun() { return Hesap.tarihAnahtar(new Date()); }
  function kaydir(k, n) { var d = Hesap.anahtardanTarih(k); d.setDate(d.getDate() + n); return Hesap.tarihAnahtar(d); }
  function tarihEtiket(k) {
    var b = bugun();
    if (k === b) return 'Bugün';
    if (k === kaydir(b, -1)) return 'Dün';
    if (k === kaydir(b, 1)) return 'Yarın';
    var d = Hesap.anahtardanTarih(k);
    return d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + GUNLER[d.getDay()];
  }
  function $(id) { return document.getElementById(id); }

  var toastZaman;
  function toast(m) {
    var t = $('toast');
    t.textContent = m; t.hidden = false;
    clearTimeout(toastZaman);
    toastZaman = setTimeout(function () { t.hidden = true; }, 2200);
  }
  function kaydet() {
    Depo.kaydet();
    if (Depo.hata) toast('Kaydedilemedi! Telefon hafızası dolu olabilir.');
  }

  // yemek + birim + adet -> gram
  function gramBul(y, birim, adet) {
    if (birim === 'g') return adet;
    var b = (y.birimler || []).filter(function (x) { return x.ad === birim; })[0];
    return b ? b.g * adet : adet;
  }
  function varsayilan(y) {
    if (y.sonBirim && (y.sonBirim === 'g' || (y.birimler || []).some(function (b) { return b.ad === y.sonBirim; })))
      return { birim: y.sonBirim, adet: y.sonAdet || 1 };
    if (y.birimler && y.birimler.length) return { birim: y.birimler[0].ad, adet: 1 };
    return { birim: 'g', adet: 100 };
  }
  function miktarYazi(birim, adet) {
    return birim === 'g' ? sayi(adet) + ' g' : sayi(adet, true) + ' ' + birim;
  }

  // ---------- KURULUM ----------
  var BU_YIL = new Date().getFullYear();
  var ADIMLAR = [
    { id: 'hos' },
    { id: 'ad', baslik: 'Adın ne?', acik: 'Uygulama seni böyle selamlayacak.', tip: 'metin', alan: 'ad' },
    { id: 'hedef', baslik: 'Hedefin ne?', tip: 'sec', alan: 'hedef', sec: [
      ['ver', '⬇️', 'Kilo vermek', 'Yağ yakıp hafiflemek'],
      ['koru', '⚖️', 'Kilomu korumak', 'Dengeli beslenmek'],
      ['al', '💪', 'Kilo almak', 'Kas ve kilo kazanmak']] },
    { id: 'cinsiyet', baslik: 'Cinsiyetin?', acik: 'Kalori ihtiyacını hesaplamak için gerekli.', tip: 'sec', alan: 'cinsiyet', sec: [
      ['erkek', '👨', 'Erkek'], ['kadin', '👩', 'Kadın']] },
    { id: 'dogum', baslik: 'Hangi yıl doğdun?', tip: 'sayi', alan: 'dogumYili', birim: '', min: 1930, max: BU_YIL - 12, ph: '1995', hataYazi: 'Doğum yılını 4 haneli yaz (ör. 1995).' },
    { id: 'boy', baslik: 'Boyun kaç?', tip: 'sayi', alan: 'boy', birim: 'cm', min: 120, max: 230, ph: '175', hataYazi: 'Boyunu santimetre olarak yaz (ör. 175).' },
    { id: 'kilo', baslik: 'Şu an kaç kilosun?', tip: 'sayi', alan: 'kilo', birim: 'kg', min: 30, max: 300, ondalik: true, ph: '85', hataYazi: 'Kilonu yaz (ör. 85 ya da 85,5).' },
    { id: 'hedefKilo', baslik: 'Hedef kilon kaç?', tip: 'sayi', alan: 'hedefKilo', birim: 'kg', min: 30, max: 300, ondalik: true, ph: '75', hataYazi: 'Hedef kilonu yaz.',
      atla: function (t) { return t.hedef === 'koru'; },
      kontrol: function (t) {
        var h = oku(t.hedefKilo), k = oku(t.kilo);
        if (t.hedef === 'ver' && h >= k) return 'Kilo vermek için hedef, şu anki kilondan az olmalı.';
        if (t.hedef === 'al' && h <= k) return 'Kilo almak için hedef, şu anki kilondan fazla olmalı.';
        return '';
      } },
    { id: 'hiz', baslik: 'Haftada ne kadar?', acik: 'Haftada 0,5 kg çoğu kişi için sağlıklı ve sürdürülebilir.', tip: 'sec', alan: 'hiz',
      atla: function (t) { return t.hedef === 'koru'; }, sec: [
      ['0.25', '🐢', '0,25 kg / hafta', 'Yavaş ve rahat'],
      ['0.5', '🚶', '0,5 kg / hafta', 'Önerilen'],
      ['0.75', '🏃', '0,75 kg / hafta', 'Hızlı'],
      ['1', '🚀', '1 kg / hafta', 'Çok hızlı, zorlayıcı']] },
    { id: 'aktivite', baslik: 'Ne kadar hareketlisin?', acik: 'Spor dışında günlük hayatını düşün.', tip: 'sec', alan: 'aktivite', sec: [
      ['az', '🪑', Hesap.AKTIVITE.az.ad, Hesap.AKTIVITE.az.acik],
      ['hafif', '🚶', Hesap.AKTIVITE.hafif.ad, Hesap.AKTIVITE.hafif.acik],
      ['orta', '🚴', Hesap.AKTIVITE.orta.ad, Hesap.AKTIVITE.orta.acik],
      ['cok', '🏋️', Hesap.AKTIVITE.cok.ad, Hesap.AKTIVITE.cok.acik]] },
    { id: 'sonuc' }
  ];

  function kurulumBaslat(duzen) {
    var p = V().profil;
    S.kur = {
      adim: duzen ? 1 : 0, duzen: !!duzen, hata: '',
      t: p ? {
        ad: p.ad, hedef: p.hedef, cinsiyet: p.cinsiyet, dogumYili: String(p.dogumYili), boy: String(p.boy),
        kilo: String(p.kilo).replace('.', ','), hedefKilo: p.hedefKilo ? String(p.hedefKilo).replace('.', ',') : '',
        hiz: String(p.hiz || 0.5), aktivite: p.aktivite
      } : { ad: 'Furkan', hedef: null, cinsiyet: null, dogumYili: '', boy: '', kilo: '', hedefKilo: '', hiz: '0.5', aktivite: null }
    };
  }

  function adimGecerli(a, t) {
    if (a.tip === 'metin') return String(t[a.alan] || '').trim() ? '' : 'Bir ad yaz.';
    if (a.tip === 'sec') return t[a.alan] ? '' : 'Birini seç.';
    if (a.tip === 'sayi') {
      var x = oku(t[a.alan]);
      if (isNaN(x) || x < a.min || x > a.max) return a.hataYazi;
      if (!a.ondalik && Math.round(x) !== x) return a.hataYazi;
      return a.kontrol ? a.kontrol(t) : '';
    }
    return '';
  }

  function kurAdimaGit(yon) {
    var k = S.kur, i = k.adim + yon;
    while (i > 0 && i < ADIMLAR.length - 1 && ADIMLAR[i].atla && ADIMLAR[i].atla(k.t)) i += yon;
    if (i < 0 || (k.duzen && i < 1)) {
      if (k.duzen) { S.kur = null; render(); }
      return;
    }
    k.adim = i; k.hata = '';
    render();
    var g = $('kurGiris');
    if (g) g.focus();
  }

  function kurIleri() {
    var k = S.kur, a = ADIMLAR[k.adim];
    var h = adimGecerli(a, k.t);
    if (h) { k.hata = h; var e = $('kurHata'); if (e) e.textContent = h; return; }
    kurAdimaGit(1);
  }

  function taslaktanProfil(t) {
    var p = {
      ad: String(t.ad).trim(), hedef: t.hedef, cinsiyet: t.cinsiyet,
      dogumYili: oku(t.dogumYili), boy: oku(t.boy), kilo: oku(t.kilo),
      hedefKilo: t.hedef === 'koru' ? null : oku(t.hedefKilo),
      hiz: t.hedef === 'koru' ? 0 : oku(t.hiz), aktivite: t.aktivite
    };
    p.kalori = Hesap.hedefKalori(p);
    var eski = V().profil;
    p.makro = (eski && eski.makro) || MAKRO_VARSAYILAN;
    return p;
  }

  function kurulumBitir() {
    var p = taslaktanProfil(S.kur.t);
    var eski = V().profil;
    p.baslangic = eski && eski.baslangic ? eski.baslangic : { tarih: bugun(), kg: p.kilo };
    V().profil = p;
    // kiloyu bugünün kaydı olarak yaz
    var kl = V().kilolar, b = bugun();
    kl = kl.filter(function (x) { return x.tarih !== b; });
    kl.push({ tarih: b, kg: p.kilo });
    kl.sort(function (a, c) { return a.tarih < c.tarih ? -1 : 1; });
    V().kilolar = kl;
    kaydet();
    var duzen = S.kur.duzen;
    S.kur = null;
    S.sekme = duzen ? 'profil' : 'gunluk';
    render();
    toast(duzen ? 'Profil güncellendi' : 'Serüven başladı! 🎉');
  }

  function renderKurulum() {
    var k = S.kur, a = ADIMLAR[k.adim], t = k.t, h = '';
    var gorunen = ADIMLAR.filter(function (x, i) { return i > 0 && !(x.atla && x.atla(t)); });
    var sira = gorunen.indexOf(a) + 1;

    if (a.id === 'hos') {
      h = '<div class="kurulum"><div class="govde" style="text-align:center">' +
        '<img class="logo-buyuk" src="icon-192.png" alt="">' +
        '<h2>Furkan\'ın Zayıflama Serüveni</h2>' +
        '<p class="acik">Hedefine göre günlük kalorini hesaplayalım. Birkaç kısa soru, bir dakika sürer.</p>' +
        '</div><button class="dugme" data-a="kurIleri">Başlayalım</button></div>';
      $('app').innerHTML = h;
      return;
    }

    h += '<div class="kurulum">';
    h += '<button class="geri" data-a="kurGeri" aria-label="Geri">' + ik('sol') + '</button>';
    h += '<div class="ilerleme"><i style="width:' + Math.round(sira / gorunen.length * 100) + '%"></i></div>';

    if (a.id === 'sonuc') {
      var p = taslaktanProfil(t);
      var m = Hesap.makroGram(p.kalori, p.makro);
      var hafta = Hesap.hedefHafta(p);
      var hedefTarih = '';
      if (hafta) {
        var d = new Date(); d.setDate(d.getDate() + hafta * 7);
        hedefTarih = '<p class="acik" style="text-align:center">Bu tempoyla <b>' + sayi(p.hedefKilo, true) + ' kg</b> hedefine yaklaşık <b>' + d.getDate() + ' ' + AYLAR[d.getMonth()] + ' ' + d.getFullYear() + '</b> tarihinde ulaşırsın.</p>';
      }
      h += '<h2>' + esc(p.ad) + ', planın hazır!</h2>';
      h += '<div class="govde"><div class="sonuc-kcal"><b>' + sayi(p.kalori) + '</b><span>günlük kalori hedefi (kcal)</span></div>';
      h += '<div class="detay-makro"><div class="c"><b>' + m.c + ' g</b><span>Karbonhidrat</span></div><div class="p"><b>' + m.p + ' g</b><span>Protein</span></div><div class="f"><b>' + m.f + ' g</b><span>Yağ</span></div></div>';
      h += '<div style="margin-top:22px">' + hedefTarih + '</div>';
      h += '<p class="acik" style="text-align:center;font-size:13px;margin-top:14px">Hesap Mifflin-St Jeor formülüyle yapıldı. Sağlık sorunun varsa hedefini doktoruna danış.</p></div>';
      h += '<button class="dugme" data-a="kurBitir">' + (k.duzen ? 'Kaydet' : 'Serüvene başla') + '</button></div>';
      $('app').innerHTML = h;
      return;
    }

    h += '<h2>' + esc(a.baslik) + '</h2>';
    if (a.acik) h += '<p class="acik">' + esc(a.acik) + '</p>';
    h += '<div class="govde">';
    if (a.tip === 'sec') {
      a.sec.forEach(function (s) {
        var secili = String(t[a.alan]) === s[0];
        h += '<button class="secenek' + (secili ? ' secili' : '') + '" data-a="kurSec" data-v="' + esc(s[0]) + '">' +
          '<span class="em">' + s[1] + '</span><span><b>' + esc(s[2]) + '</b>' + (s[3] ? '<small>' + esc(s[3]) + '</small>' : '') + '</span></button>';
      });
    } else {
      var tip = a.tip === 'metin' ? 'type="text" autocomplete="given-name"' : 'type="text" inputmode="' + (a.ondalik ? 'decimal' : 'numeric') + '"';
      h += '<div class="buyuk-giris"><input id="kurGiris" ' + tip + ' data-i="kur" value="' + esc(t[a.alan]) + '" placeholder="' + esc(a.ph || '') + '" enterkeyhint="next"' +
        (a.tip === 'metin' ? ' style="width:100%;font-size:36px"' : '') + '>' + (a.birim ? '<span>' + a.birim + '</span>' : '') + '</div>';
    }
    h += '<p class="hata" id="kurHata">' + esc(k.hata) + '</p></div>';
    if (a.tip !== 'sec') h += '<button class="dugme" data-a="kurIleri">Devam</button>';
    h += '</div>';
    $('app').innerHTML = h;
  }

  // ---------- ANA EKRAN ----------
  var SEKMELER = [
    { id: 'gunluk', ad: 'Günlük', ik: 'gunluk' },
    { id: 'oruc', ad: 'Oruç', ik: 'oruc' },
    { id: 'tarifler', ad: 'Tarifler', ik: 'tarif' },
    { id: 'ilerleme', ad: 'İlerleme', ik: 'ilerleme' },
    { id: 'profil', ad: 'Profil', ik: 'profil' }
  ];

  function render() {
    if (S.kur) return renderKurulum();
    if (!V().profil) { kurulumBaslat(false); return renderKurulum(); }
    var sk = SEKMELER.filter(function (s) { return s.id === S.sekme; })[0];
    var h = '<header class="ust"><div class="alt">Furkan\'ın Zayıflama Serüveni</div><h1>' + esc(sk.ad) + '</h1></header>';
    h += '<main class="icerik">';
    if (S.sekme === 'gunluk') h += gunlukHtml();
    else if (S.sekme === 'profil') h += profilHtml();
    else h += yakindaHtml(S.sekme);
    h += '</main><nav class="sekmeler">';
    SEKMELER.forEach(function (s) {
      h += '<button class="' + (s.id === S.sekme ? 'secili' : '') + '" data-a="sekme" data-v="' + s.id + '">' + ik(s.ik) + s.ad + '</button>';
    });
    h += '</nav>';
    $('app').innerHTML = h;
  }

  function gunlukHtml() {
    var p = V().profil, g = Depo.gunOku(S.tarih), A = V().ayarlar;
    var top = Hesap.topla(g.kayitlar);
    var yakilan = 0;
    var hedef = p.kalori + yakilan;
    var kalan = hedef - top.k;
    var asti = kalan < 0;
    var C = 2 * Math.PI * 60;
    var oran = Math.min(1, hedef ? top.k / hedef : 0);
    var mg = Hesap.makroGram(p.kalori, p.makro);

    var h = '<div class="tarih"><button class="ok" data-a="gun" data-v="-1" aria-label="Önceki gün">' + ik('sol') + '</button>' +
      '<button class="gun" data-a="bugun">' + esc(tarihEtiket(S.tarih)) + '</button>' +
      '<button class="ok" data-a="gun" data-v="1" aria-label="Sonraki gün">' + ik('sag') + '</button></div>';

    h += '<section class="kart"><div class="ozet">' +
      '<div class="yan"><b>' + sayi(top.k) + '</b><span>Yenen</span></div>' +
      '<div class="halka' + (asti ? ' asti' : '') + '"><svg viewBox="0 0 140 140"><circle class="iz" cx="70" cy="70" r="60" fill="none" stroke-width="12"/>' +
      '<circle class="dolu" cx="70" cy="70" r="60" fill="none" stroke-width="12" stroke-linecap="round" stroke-dasharray="' + C.toFixed(1) + '" stroke-dashoffset="' + (C * (1 - (asti ? 1 : oran))).toFixed(1) + '"/></svg>' +
      '<div class="orta"><b>' + sayi(Math.abs(kalan)) + '</b><span>' + (asti ? 'kcal fazla' : 'kcal kaldı') + '</span></div></div>' +
      '<div class="yan"><b>' + sayi(yakilan) + '</b><span>Yakılan</span></div></div>';
    h += '<div class="makrolar">' +
      makroHtml('c', 'Karbonhidrat', top.c, mg.c) + makroHtml('p', 'Protein', top.p, mg.p) + makroHtml('f', 'Yağ', top.f, mg.f) + '</div></section>';

    OGUNLER.forEach(function (o) {
      var ks = g.kayitlar.filter(function (e) { return e.ogun === o.id; });
      var t = Hesap.topla(ks);
      var oneri = Math.round(p.kalori * (A.ogunOran[o.id] || 0) / 100 / 10) * 10;
      h += '<section class="kart"><div class="ogun-bas"><div class="ogun-ikon">' + o.em + '</div>' +
        '<div class="bilgi"><b>' + o.ad + '</b><span>' + (ks.length ? sayi(t.k) + ' / ' : 'Önerilen ') + sayi(oneri) + ' kcal</span></div>' +
        '<button class="arti" data-a="ekle" data-v="' + o.id + '" aria-label="' + o.ad + ' ekle">' + ik('arti') + '</button></div>';
      if (ks.length) {
        h += '<div class="kayitlar">';
        ks.forEach(function (e) {
          h += '<button class="kayit" data-a="kayitAc" data-v="' + e.id + '"><span class="ad"><b>' + esc(e.ad) + '</b><span>' + esc(miktarYazi(e.birim, e.adet)) + '</span></span><span class="kcal">' + sayi(e.k) + '</span></button>';
        });
        h += '</div>';
      }
      h += '</section>';
    });

    var bardak = A.bardak, dolu = Math.round((g.su || 0) / bardak);
    var adet = Math.min(16, Math.max(Math.ceil(A.suHedef / bardak), dolu + 1));
    h += '<section class="kart"><div class="ogun-bas"><div class="ogun-ikon" style="background:color-mix(in srgb,var(--su) 18%,transparent)">💧</div>' +
      '<div class="bilgi"><b>Su</b><span>' + litre(g.su || 0) + ' / ' + litre(A.suHedef) + ' L</span></div></div><div class="su-bardaklar">';
    for (var i = 0; i < adet; i++) {
      h += '<button class="bardak' + (i < dolu ? ' dolu' : '') + '" data-a="su" data-v="' + i + '" aria-label="' + (i + 1) + '. bardak">' + BARDAK + '</button>';
    }
    h += '</div></section>';
    return h;
  }

  function makroHtml(cls, ad, deger, hedef) {
    var o = hedef ? Math.min(100, deger / hedef * 100) : 0;
    return '<div class="makro ' + cls + '"><div class="ad">' + ad + '</div><div class="cubuk"><i style="width:' + o.toFixed(0) + '%"></i></div>' +
      '<div class="deger">' + sayi(deger) + ' / ' + hedef + ' g</div></div>';
  }

  function yakindaHtml(sekme) {
    var B = {
      oruc: ['⏱️', 'Oruç sayacı', 'Sıradaki güncellemelerde geliyor:', ['16:8, 5:2 ve 6:1 planları', 'Geri sayım halkası', 'Oruç evreleri', 'Bitince bildirim']],
      tarifler: ['🍲', 'Tarifler', 'Sıradaki güncellemelerde geliyor:', ['Hazır Türk yemeği tarifleri', '"Elimde ne var?" ile yapay zekâ tarifi', 'Filtreler ve alışveriş listesi', 'Adım adım pişirme modu']],
      ilerleme: ['📈', 'İlerleme', 'Sıradaki güncellemelerde geliyor:', ['Kilo grafiği', 'Haftalık ve aylık kalori', 'Vücut ölçüleri ve ruh hali', 'Rozetler']]
    }[sekme];
    return '<div class="kart yakinda-kart"><div class="em">' + B[0] + '</div><h2>' + B[1] + '</h2><p>' + B[2] + '</p><ul>' +
      B[3].map(function (x) { return '<li>' + x + '</li>'; }).join('') + '</ul></div>';
  }

  function profilHtml() {
    var p = V().profil, A = V().ayarlar;
    var h = '<section class="kart"><div class="profil-bas"><div class="avatar">' + esc(p.ad.charAt(0).toLocaleUpperCase('tr-TR')) + '</div>' +
      '<div><h2>' + esc(p.ad) + '</h2><span style="color:var(--soluk)">' + HEDEF_AD[p.hedef] + (p.hiz ? ' · ' + sayi(p.hiz, true) + ' kg/hafta' : '') + '</span></div></div>';
    h += '<div class="bilgi-izgara">' +
      '<div><span>Günlük hedef</span><b>' + sayi(p.kalori) + ' kcal</b></div>' +
      '<div><span>Şu anki kilo</span><b>' + sayi(p.kilo, true) + ' kg</b></div>' +
      '<div><span>Hedef kilo</span><b>' + (p.hedefKilo ? sayi(p.hedefKilo, true) + ' kg' : '—') + '</b></div>' +
      '<div><span>Başlangıç</span><b>' + sayi(p.baslangic ? p.baslangic.kg : p.kilo, true) + ' kg</b></div>' +
      '<div><span>Boy · Yaş</span><b>' + p.boy + ' cm · ' + Hesap.yas(p.dogumYili) + '</b></div>' +
      '<div><span>Hareket</span><b style="font-size:15px">' + Hesap.AKTIVITE[p.aktivite].ad + '</b></div></div></section>';

    h += '<section class="kart" style="padding-top:2px;padding-bottom:2px">' +
      '<button class="satir-dugme" data-a="profilDuzenle">' + ik('hedef') + '<span>Profili ve hedefi düzenle</span>' + ik('sag') + '</button>' +
      '<button class="satir-dugme" data-a="suAyar">' + ik('damla') + '<span>Su hedefi</span><small>' + sayi(A.suHedef / 1000, true) + ' L · bardak ' + A.bardak + ' ml</small></button>' +
      '</section>';

    h += '<div class="bolum-bas">Yedekleme</div><section class="kart" style="padding-top:2px;padding-bottom:2px">' +
      '<button class="satir-dugme" data-a="yedekAl">' + ik('indir') + '<span>Yedek al</span><small>dosya olarak kaydet</small></button>' +
      '<label class="satir-dugme" style="cursor:pointer">' + ik('yukle') + '<span>Yedekten geri yükle</span><input type="file" id="yedekDosya" accept=".json,application/json" hidden></label>' +
      '<button class="satir-dugme" data-a="sifirla" style="color:var(--uyari)">' + ik('cop') + '<span>Tüm verileri sil</span></button>' +
      '</section>';
    h += '<p class="surum">Furkan\'ın Zayıflama Serüveni · Sürüm ' + SURUM + '<br>Veriler yalnızca bu telefonda saklanır.</p>';
    return h;
  }

  // ---------- ALT ÇEKMECE ----------
  function sheetAc() {
    var sh = $('sheet'), pe = $('perde');
    var yeni = sh.hidden;
    renderSheet();
    if (yeni) {
      sh.hidden = false; pe.hidden = false;
      void sh.offsetHeight;
      sh.classList.add('acik'); pe.classList.add('acik');
    }
  }
  function sheetKapat() {
    var sh = $('sheet'), pe = $('perde');
    S.sheet = null;
    sh.classList.remove('acik'); pe.classList.remove('acik');
    setTimeout(function () { if (!S.sheet) { sh.hidden = true; pe.hidden = true; sh.innerHTML = ''; } }, 320);
  }
  function ogunAd(id) { return OGUNLER.filter(function (o) { return o.id === id; })[0].ad; }

  function renderSheet() {
    var s = S.sheet, sh = $('sheet');
    if (!s) return;
    sh.classList.toggle('kisa', s.tur === 'elle' || s.tur === 'su');
    if (s.tur === 'ekle') sh.innerHTML = ekleHtml(s);
    else if (s.tur === 'detay') sh.innerHTML = detayHtml(s);
    else if (s.tur === 'elle') sh.innerHTML = elleHtml(s);
    else if (s.tur === 'su') sh.innerHTML = suHtml();
  }

  function basHtml(baslik, solAksiyon, sag) {
    return '<div class="sheet-bas"><button data-a="' + solAksiyon + '" aria-label="' + (solAksiyon === 'geri' ? 'Geri' : 'Kapat') + '">' + ik(solAksiyon === 'geri' ? 'sol' : 'kapat') + '</button>' +
      '<h3>' + esc(baslik) + '</h3>' + (sag || '<span style="width:40px"></span>') + '</div>';
  }

  // Yemek ekleme / arama
  function ekleHtml(s) {
    var h = basHtml(ogunAd(s.ogun) + ' ekle', 'kapat');
    h += '<div class="sheet-govde"><div class="arama">' + ik('ara') +
      '<input id="araKutu" type="search" placeholder="Yemek ara… (ör. mercimek)" value="' + esc(s.q) + '" autocomplete="off" autocorrect="off" enterkeyhint="search"></div>';
    h += '<div class="hizli">' +
      '<button class="yakinda" data-a="yakinda">' + ik('kamera') + 'Fotoğraf</button>' +
      '<button class="yakinda" data-a="yakinda">' + ik('barkod') + 'Barkod</button>' +
      '<button class="yakinda" data-a="yakinda">' + ik('mik') + 'Sesle</button>' +
      '<button data-a="elle">' + ik('kalem') + 'Hızlı ekle</button></div>';
    h += '<div id="sonuclar">' + sonuclarHtml(s) + '</div></div>';
    return h;
  }

  function tumYemekler() {
    var gor = {}, l = [];
    V().favoriler.concat(V().sonlar, YEMEKLER).forEach(function (y) {
      var k = Hesap.duz(y.ad + '|' + (y.marka || ''));
      if (gor[k]) return; gor[k] = 1; l.push(y);
    });
    return l;
  }

  function yemekSatir(y) {
    var i = S.reg.push(y) - 1;
    var v = varsayilan(y);
    var b = Hesap.besin(y, gramBul(y, v.birim, v.adet));
    return '<div class="yemek-satir"><button class="ad" data-a="detay" data-v="' + i + '"><b>' + esc(y.ad) + '</b><span>' +
      (y.marka ? esc(y.marka) + ' · ' : '') + esc(miktarYazi(v.birim, v.adet)) + ' · ' + sayi(b.k) + ' kcal</span></button>' +
      '<button class="mini-arti" data-a="hizliEkle" data-v="' + i + '" aria-label="Ekle">' + ik('arti') + '</button></div>';
  }

  function sonuclarHtml(s) {
    S.reg = [];
    var h = '';
    if (!s.q.trim()) {
      h += '<div class="sekme-sec"><button class="' + (s.sekme === 'son' ? 'secili' : '') + '" data-a="ekleSekme" data-v="son">Son eklenenler</button>' +
        '<button class="' + (s.sekme === 'fav' ? 'secili' : '') + '" data-a="ekleSekme" data-v="fav">Favoriler</button></div>';
      var l = s.sekme === 'son' ? V().sonlar : V().favoriler;
      if (!l.length) {
        h += '<div class="bos"><span class="em">' + (s.sekme === 'son' ? '🍽️' : '⭐') + '</span>' +
          (s.sekme === 'son' ? 'Henüz bir şey eklemedin. Yukarıdan ara.' : 'Bir yemeğin sayfasında yıldıza dokunarak favorilere ekle.') + '</div>';
      } else {
        h += '<div class="liste" style="margin-top:10px">' + l.map(yemekSatir).join('') + '</div>';
      }
      return h;
    }
    var r = Hesap.ara(tumYemekler(), s.q, 40);
    if (r.length) h += '<div class="liste">' + r.map(yemekSatir).join('') + '</div>';
    else h += '<div class="bos"><span class="em">🔍</span>Listede bulunamadı.</div>';
    h += '<button class="dis-ara" data-a="elle">Aradığını bulamadın mı? Kendin gir</button>';
    return h;
  }

  function sonuclariYenile() {
    var el = $('sonuclar');
    if (el && S.sheet && S.sheet.tur === 'ekle') el.innerHTML = sonuclarHtml(S.sheet);
  }

  // Open Food Facts ürününü yemek nesnesine çevirir (barkod özelliği kullanacak)
  function offDonustur(u) {
    var n = u.nutriments || {};
    var k = n['energy-kcal_100g'];
    if (k == null && n.energy_100g != null) k = n.energy_100g / 4.184;
    var ad = (u.product_name_tr || u.product_name || '').trim();
    if (!ad || k == null || isNaN(k)) return null;
    var birimler = [];
    var sq = Number(u.serving_quantity);
    if (sq > 0 && sq < 2000) birimler.push({ ad: 'porsiyon', g: Math.round(sq) });
    return {
      ad: ad, marka: (u.brands || '').split(',')[0].trim(), barkod: u.code || '',
      k: Math.round(k), p: Hesap.yuvarla(Number(n.proteins_100g) || 0), c: Hesap.yuvarla(Number(n.carbohydrates_100g) || 0),
      f: Hesap.yuvarla(Number(n.fat_100g) || 0), birimler: birimler, kaynak: 'off'
    };
  }

  // Yemek detayı
  function detayAc(y, ayar) {
    var v = ayar.kayit ? { birim: ayar.kayit.birim, adet: ayar.kayit.adet } : varsayilan(y);
    S.sheet = { tur: 'detay', y: y, ogun: ayar.ogun, birim: v.birim, adet: String(v.adet).replace('.', ','), kayitId: ayar.kayit ? ayar.kayit.id : null, geri: ayar.geri || null };
    sheetAc();
  }

  function detayHtml(s) {
    var y = s.y, fav = Depo.favoriMi(y.ad);
    var h = basHtml('', s.geri ? 'geri' : 'kapat',
      '<button class="yildiz' + (fav ? ' dolu' : '') + '" data-a="favori" aria-label="Favori">' + ik('yildiz') + '</button>');
    h += '<div class="sheet-govde"><div class="detay-bas"><h2>' + esc(y.ad) + '</h2>' + (y.marka ? '<span>' + esc(y.marka) + '</span>' : '') + '</div>';
    h += '<div class="miktar"><input id="adetKutu" type="text" inputmode="decimal" value="' + esc(s.adet) + '" aria-label="Miktar">' +
      '<select id="birimSec" aria-label="Birim">';
    (y.birimler || []).forEach(function (b) {
      h += '<option value="' + esc(b.ad) + '"' + (s.birim === b.ad ? ' selected' : '') + '>' + esc(b.ad) + ' (' + b.g + ' g)</option>';
    });
    h += '<option value="g"' + (s.birim === 'g' ? ' selected' : '') + '>gram</option></select></div>';
    h += '<div id="detayCanli">' + detayCanliHtml(s) + '</div>';
    h += '<div class="ogun-sec">' + OGUNLER.map(function (o) {
      return '<button class="' + (s.ogun === o.id ? 'secili' : '') + '" data-a="ogunSec" data-v="' + o.id + '">' + o.em + ' ' + o.ad + '</button>';
    }).join('') + '</div>';
    h += '<p class="not100">100 g: ' + sayi(y.k) + ' kcal · K ' + sayi(y.c, true) + ' g · P ' + sayi(y.p, true) + ' g · Y ' + sayi(y.f, true) + ' g' +
      (y.kaynak === 'off' ? '<br>Kaynak: Open Food Facts' : (y.kaynak === 'elle' ? '' : '<br>Değerler yaklaşık ortalamadır')) + '</p></div>';
    h += '<div class="sheet-alt"><button class="dugme" data-a="detayKaydet">' + (s.kayitId ? 'Kaydet' : 'Ekle') + '</button>' +
      (s.kayitId ? '<button class="dugme tehlike" data-a="kayitSil">' + ik('cop') + 'Sil</button>' : '') + '</div>';
    return h;
  }

  function detayCanliHtml(s) {
    var adet = oku(s.adet);
    var b = Hesap.besin(s.y, adet > 0 ? gramBul(s.y, s.birim, adet) : 0);
    return '<div class="detay-kcal"><b>' + sayi(b.k) + '</b><span>kcal</span></div>' +
      '<div class="detay-makro"><div class="c"><b>' + sayi(b.c, true) + ' g</b><span>Karbonhidrat</span></div>' +
      '<div class="p"><b>' + sayi(b.p, true) + ' g</b><span>Protein</span></div>' +
      '<div class="f"><b>' + sayi(b.f, true) + ' g</b><span>Yağ</span></div></div>';
  }

  function kayitYaz(y, ogun, birim, adet, eskiId) {
    var gram = gramBul(y, birim, adet);
    var b = Hesap.besin(y, gram);
    var e = { id: eskiId || Depo.yeniId(), ogun: ogun, ad: y.ad, birim: birim, adet: adet, gram: gram, k: b.k, p: b.p, c: b.c, f: b.f, y: Depo.yemekKopya(y) };
    var g = Depo.gun(S.tarih);
    if (eskiId) g.kayitlar = g.kayitlar.map(function (x) { return x.id === eskiId ? e : x; });
    else g.kayitlar.push(e);
    Depo.sonaEkle(y, birim, adet);
    kaydet();
    return e;
  }

  function detayKaydet() {
    var s = S.sheet, adet = oku(s.adet);
    if (!(adet > 0)) { toast('Miktarı yaz'); return; }
    kayitYaz(s.y, s.ogun, s.birim, adet, s.kayitId);
    render();
    if (s.geri) { S.sheet = s.geri; S.sheet.ogun = s.ogun; renderSheet(); }
    else sheetKapat();
    toast((s.kayitId ? 'Kaydedildi: ' : 'Eklendi: ') + s.y.ad);
  }

  // Hızlı (elle) ekleme
  function elleHtml(s) {
    var h = basHtml('Hızlı ekle', 'geri');
    h += '<div class="sheet-govde"><p style="color:var(--soluk);font-size:14px;margin-bottom:14px">Listede olmayan bir şeyi bir porsiyon olarak elle gir. Yalnızca ad ve kalori zorunlu.</p>' +
      '<div class="form-alan"><label for="eAd">Ne yedin?</label><input id="eAd" type="text" placeholder="ör. Annemin böreği"></div>' +
      '<div class="form-alan"><label for="eK">Kalori (kcal)</label><input id="eK" type="text" inputmode="numeric" placeholder="ör. 350"></div>' +
      '<div class="uc"><div class="form-alan"><label for="eC">Karb. (g)</label><input id="eC" type="text" inputmode="decimal"></div>' +
      '<div class="form-alan"><label for="eP">Protein (g)</label><input id="eP" type="text" inputmode="decimal"></div>' +
      '<div class="form-alan"><label for="eF">Yağ (g)</label><input id="eF" type="text" inputmode="decimal"></div></div>' +
      '<button class="dugme" data-a="elleKaydet" style="margin-top:6px">' + esc(ogunAd(s.ogun)) + ' öğününe ekle</button></div>';
    return h;
  }

  function elleKaydet() {
    var s = S.sheet;
    var ad = $('eAd').value.trim(), k = oku($('eK').value);
    if (!ad) { toast('Ne yediğini yaz'); return; }
    if (!(k >= 0)) { toast('Kaloriyi yaz'); return; }
    var y = { ad: ad, k: Math.round(k), c: oku($('eC').value) || 0, p: oku($('eP').value) || 0, f: oku($('eF').value) || 0, birimler: [{ ad: 'porsiyon', g: 100 }], kaynak: 'elle' };
    kayitYaz(y, s.ogun, 'porsiyon', 1);
    render();
    S.sheet = s.geri; renderSheet();
    toast('Eklendi: ' + ad);
  }

  // Su ayarı
  function suHtml() {
    var A = V().ayarlar;
    var h = basHtml('Su hedefi', 'kapat') + '<div class="sheet-govde"><div class="bolum-bas">Günlük hedef</div><div class="ogun-sec">';
    [1500, 2000, 2500, 3000, 3500].forEach(function (x) {
      h += '<button class="' + (A.suHedef === x ? 'secili' : '') + '" data-a="suHedef" data-v="' + x + '">' + sayi(x / 1000, true) + ' L</button>';
    });
    h += '</div><div class="bolum-bas">Bardak büyüklüğü</div><div class="ogun-sec">';
    [200, 250, 300, 500].forEach(function (x) {
      h += '<button class="' + (A.bardak === x ? 'secili' : '') + '" data-a="suBardak" data-v="' + x + '">' + x + ' ml</button>';
    });
    h += '</div></div>';
    return h;
  }

  // ---------- yedek ----------
  function yedekAl() {
    var ad = 'seruven-yedek-' + bugun() + '.json';
    var metin = Depo.disaAktar();
    var dosya;
    try { dosya = new File([metin], ad, { type: 'application/json' }); } catch (e) { dosya = null; }
    if (dosya && navigator.canShare && navigator.canShare({ files: [dosya] })) {
      navigator.share({ files: [dosya], title: 'Serüven yedeği' }).catch(function () {});
      return;
    }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([metin], { type: 'application/json' }));
    a.download = ad;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 5000);
  }

  function yedekYukle(dosya) {
    var r = new FileReader();
    r.onload = function () {
      try {
        if (!confirm('Yedek yüklenirse bu telefondaki şu anki veriler yedektekiyle değişir. Devam edilsin mi?')) return;
        Depo.iceAktar(String(r.result));
        S.sekme = 'gunluk';
        render();
        toast('Yedek yüklendi');
      } catch (e) { alert('Yedek yüklenemedi: ' + e.message); }
    };
    r.readAsText(dosya);
  }

  // ---------- olaylar ----------
  var AKS = {
    kurIleri: kurIleri,
    kurGeri: function () { kurAdimaGit(-1); },
    kurSec: function (el) {
      var a = ADIMLAR[S.kur.adim];
      S.kur.t[a.alan] = el.dataset.v;
      document.querySelectorAll('.secenek').forEach(function (b) { b.classList.toggle('secili', b === el); });
      setTimeout(function () { kurIleri(); }, 160);
    },
    kurBitir: kurulumBitir,
    sekme: function (el) { S.sekme = el.dataset.v; render(); window.scrollTo(0, 0); },
    gun: function (el) { S.tarih = kaydir(S.tarih, Number(el.dataset.v)); render(); },
    bugun: function () { S.tarih = bugun(); render(); },
    ekle: function (el) {
      S.sheet = { tur: 'ekle', ogun: el.dataset.v, q: '', sekme: 'son' };
      sheetAc();
    },
    kapat: sheetKapat,
    geri: function () {
      var g = S.sheet && S.sheet.geri;
      if (g) { S.sheet = g; renderSheet(); } else sheetKapat();
    },
    ekleSekme: function (el) { S.sheet.sekme = el.dataset.v; sonuclariYenile(); },
    detay: function (el) {
      var y = S.reg[Number(el.dataset.v)];
      detayAc(y, { ogun: S.sheet.ogun, geri: S.sheet });
    },
    hizliEkle: function (el) {
      var y = S.reg[Number(el.dataset.v)], v = varsayilan(y);
      kayitYaz(y, S.sheet.ogun, v.birim, v.adet);
      render();
      toast('Eklendi: ' + y.ad + ' (' + miktarYazi(v.birim, v.adet) + ')');
      sonuclariYenile();
    },
    kayitAc: function (el) {
      var e = Depo.gunOku(S.tarih).kayitlar.filter(function (x) { return x.id === el.dataset.v; })[0];
      if (e) detayAc(e.y, { ogun: e.ogun, kayit: e });
    },
    ogunSec: function (el) {
      S.sheet.ogun = el.dataset.v;
      document.querySelectorAll('.ogun-sec button').forEach(function (b) { b.classList.toggle('secili', b === el); });
    },
    favori: function (el) {
      Depo.favoriDegistir(S.sheet.y);
      var f = Depo.favoriMi(S.sheet.y.ad);
      el.classList.toggle('dolu', f);
      toast(f ? 'Favorilere eklendi' : 'Favorilerden çıkarıldı');
    },
    detayKaydet: detayKaydet,
    kayitSil: function () {
      var s = S.sheet, g = Depo.gun(S.tarih);
      g.kayitlar = g.kayitlar.filter(function (x) { return x.id !== s.kayitId; });
      kaydet(); render(); sheetKapat();
      toast('Silindi: ' + s.y.ad);
    },
    elle: function () { S.sheet = { tur: 'elle', ogun: S.sheet.ogun, geri: S.sheet }; renderSheet(); },
    elleKaydet: elleKaydet,
    yakinda: function () { toast('Bu özellik sıradaki güncellemede geliyor'); },
    su: function (el) {
      var g = Depo.gun(S.tarih), b = V().ayarlar.bardak, n = Number(el.dataset.v);
      var dolu = Math.round((g.su || 0) / b);
      g.su = n < dolu ? n * b : (n + 1) * b;
      kaydet(); render();
    },
    suAyar: function () { S.sheet = { tur: 'su' }; sheetAc(); },
    suHedef: function (el) { V().ayarlar.suHedef = Number(el.dataset.v); kaydet(); renderSheet(); render(); },
    suBardak: function (el) { V().ayarlar.bardak = Number(el.dataset.v); kaydet(); renderSheet(); render(); },
    profilDuzenle: function () { kurulumBaslat(true); render(); window.scrollTo(0, 0); },
    yedekAl: yedekAl,
    sifirla: function () {
      if (!confirm('Bu telefondaki TÜM veriler (profil, günlük, kilolar) silinecek. Emin misin?')) return;
      if (!confirm('Geri alınamaz. Önce yedek almanı öneririm. Yine de silinsin mi?')) return;
      Depo.sifirla(); S.sekme = 'gunluk'; S.tarih = bugun(); render();
    }
  };

  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-a]');
    if (!el) return;
    var f = AKS[el.dataset.a];
    if (f) { e.preventDefault(); f(el, e); }
  });
  $('perde').addEventListener('click', sheetKapat);

  document.addEventListener('input', function (e) {
    var t = e.target;
    if (t.id === 'kurGiris' && S.kur) {
      S.kur.t[ADIMLAR[S.kur.adim].alan] = t.value;
      if (S.kur.hata) { S.kur.hata = ''; $('kurHata').textContent = ''; }
    } else if (t.id === 'araKutu' && S.sheet) {
      S.sheet.q = t.value;
      sonuclariYenile();
    } else if (t.id === 'adetKutu' && S.sheet) {
      S.sheet.adet = t.value;
      $('detayCanli').innerHTML = detayCanliHtml(S.sheet);
    }
  });

  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.id === 'birimSec' && S.sheet) {
      var eski = S.sheet.birim;
      S.sheet.birim = t.value;
      if (t.value === 'g' && eski !== 'g') S.sheet.adet = String(Math.round(gramBul(S.sheet.y, eski, oku(S.sheet.adet) || 1)));
      else if (t.value !== 'g' && eski === 'g') S.sheet.adet = '1';
      $('adetKutu').value = S.sheet.adet;
      $('detayCanli').innerHTML = detayCanliHtml(S.sheet);
    } else if (t.id === 'yedekDosya' && t.files && t.files[0]) {
      yedekYukle(t.files[0]);
      t.value = '';
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    if (e.target.id === 'kurGiris') { e.preventDefault(); kurIleri(); }
    else if (e.target.id === 'araKutu') { e.target.blur(); }
    else if (e.target.id === 'adetKutu') { e.preventDefault(); detayKaydet(); }
  });

  // Gün değişince (uygulama gece açık kaldıysa) bugüne dön
  var sonBugun = bugun();
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState !== 'visible') return;
    var b = bugun();
    if (b !== sonBugun) { if (S.tarih === sonBugun) S.tarih = b; sonBugun = b; if (!S.sheet) render(); }
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }

  render();
})();
