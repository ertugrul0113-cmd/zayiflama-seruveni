// Barkod okuma: kamera (html5-qrcode) veya elle numara, ürün bilgisi Open Food Facts'ten.
(function () {
  'use strict';
  var A = App, V = A.V, esc = A.esc, $ = A.$;
  var okuyucu = null, kutuphane = null;

  function kutuphaneYukle() {
    if (window.Html5Qrcode) return Promise.resolve();
    if (kutuphane) return kutuphane;
    kutuphane = new Promise(function (ok, red) {
      var s = document.createElement('script');
      s.src = 'vendor/html5-qrcode.min.js';
      s.onload = function () { ok(); };
      s.onerror = function () { kutuphane = null; red(new Error('Barkod okuyucu yüklenemedi. İnterneti kontrol et.')); };
      document.head.appendChild(s);
    });
    return kutuphane;
  }

  function durdur() {
    var o = okuyucu; okuyucu = null;
    if (o) { try { o.stop().then(function () { try { o.clear(); } catch (e) {} }).catch(function () {}); } catch (e) {} }
  }
  A.kapanis.push(function (s) { if (s && s.tur === 'barkod') durdur(); });

  A.sheetler.barkod = function (s) {
    var h = A.basHtml('Barkod okut', 'geri') + '<div class="sheet-govde">';
    h += '<div id="okuyucu" class="okuyucu"></div>';
    h += '<p class="ipucu" id="barkodDurum" style="text-align:center">' + esc(s.durum || 'Kamera açılıyor…') + '</p>';
    h += '<div class="bolum-bas">Ya da numarayı yaz</div><div class="arama">' +
      '<input id="barkodNo" type="text" inputmode="numeric" placeholder="ör. 8690504011750" enterkeyhint="search">' +
      '<button class="mini-arti" data-a="barkodAra" aria-label="Ara">' + A.ik('ara') + '</button></div></div>';
    return h;
  };

  function baslat(s) {
    kutuphaneYukle().then(function () {
      if (A.S.sheet !== s) return;
      var F = window.Html5QrcodeSupportedFormats;
      okuyucu = new window.Html5Qrcode('okuyucu', { formatsToSupport: [F.EAN_13, F.EAN_8, F.UPC_A, F.UPC_E], verbose: false });
      return okuyucu.start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 260, height: 130 }, aspectRatio: 1.333 },
        function (kod) { if (A.S.sheet === s && !s.bulundu) { s.bulundu = true; durdur(); urunBul(kod, s); } },
        function () {}
      ).then(function () { var d = $('barkodDurum'); if (d) d.textContent = 'Barkodu çerçevenin içine tut.'; });
    }).catch(function (e) {
      var d = $('barkodDurum');
      var m = String(e && (e.message || e));
      if (d) d.textContent = /permission|notallowed/i.test(m) ? 'Kamera izni verilmedi. Ayarlar > Safari > Kamera\'dan izin verebilir ya da numarayı yazabilirsin.' : 'Kamera açılamadı. Numarayı aşağıya yazabilirsin.';
    });
  }

  function urunBul(kod, s) {
    kod = String(kod).replace(/\D/g, '');
    if (kod.length < 8) { A.toast('Barkod numarası eksik'); return; }
    var d = $('barkodDurum'); if (d) d.textContent = 'Ürün aranıyor… (' + kod + ')';
    // önce kendi kayıtlarımızda
    var yerel = V().yemeklerim.concat(V().sonlar, V().favoriler).filter(function (y) { return y.barkod === kod; })[0];
    if (yerel) { A.detayAc(yerel, { ogun: s.ogun, geri: s.geri }); return; }
    fetch('https://world.openfoodfacts.org/api/v2/product/' + kod + '.json?fields=code,product_name,product_name_tr,product_name_en,generic_name,generic_name_tr,brands,nutriments,serving_quantity')
      .then(function (r) { return r.json(); })
      .then(function (j) {
        if (A.S.sheet !== s) return;
        var y = j && j.status === 1 && j.product ? A.offDonustur(Object.assign({ code: kod }, j.product)) : null;
        if (y) A.detayAc(y, { ogun: s.ogun, geri: s.geri });
        else bulunamadi(kod, s);
      })
      .catch(function () {
        if (A.S.sheet !== s) return;
        s.bulundu = false;
        var d2 = $('barkodDurum'); if (d2) d2.textContent = 'İnternete ulaşılamadı. Bağlantını kontrol edip tekrar dene.';
      });
  }

  function bulunamadi(kod, s) {
    A.toast('Bu ürün veritabanında yok. Bilgilerini paketten gir.');
    A.S.sheet = { tur: 'elle', ogun: s.ogun, barkod: kod, geri: s.geri };
    A.renderSheet();
  }

  A.aks.barkod = function () {
    var s = { tur: 'barkod', ogun: A.S.sheet.ogun };
    A.sheetGec(s);
    baslat(s);
  };
  A.aks.barkodAra = function () {
    var s = A.S.sheet;
    durdur(); s.bulundu = true;
    urunBul($('barkodNo').value, s);
  };
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.id === 'barkodNo') { e.preventDefault(); A.aks.barkodAra(); }
  });
})();
