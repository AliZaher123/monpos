// ==========================
// 🧾 RECUPERER + AFFICHER TICKET
// ==========================
// ==========================
// 🧾 RECUPERER + AFFICHER TICKET
// ==========================
async function loadTicket(venteId) {

  try {

    // ✅ FIX IMPORTANT : API dynamique (Render / local)
    const res = await fetch(`${API}/ventes/ticket/${venteId}`);
    const vente = await res.json();

    if (!vente) {
      alert("Ticket introuvable !");
      return;
    }

    const t = vente.ticket || {};

    console.log("TICKET DATA:", t);

    let html = `<div style="font-family: monospace; text-align:center;">`;

    // ======================
    // LOGO (SAFE)
    // ======================
    if (t.logo && typeof t.logo === "string" && t.logo.startsWith("data:image")) {
      html += `<img src="${t.logo}" style="max-width:100px;"><br>`;
    }

    // ======================
    // HEADER
    // ======================
    if (t.headerText) {
      html += `<p>${t.headerText.replace(/\n/g, "<br>")}</p>`;
    }

    html += `<hr style="border-top:1px dashed black;">`;

    // ======================
    // PRODUITS
    // ======================
    if (Array.isArray(vente.produits)) {
      vente.produits.forEach(p => {
        html += `<p>${p.nom} x${p.quantite} = ${Number(p.total).toFixed(2)} USD</p>`;
      });
    }

    html += `<hr style="border-top:1px dashed black;">`;

    // ======================
    // TOTAL
    // ======================
    html += `<p><b>TOTAL: ${Number(vente.totalGeneral || 0).toFixed(2)} USD</b></p>`;

    // ======================
    // TVA
    // ======================
    if (t.enableTVA) {
      html += `<p>TVA incluse</p>`;
    }

    html += `<p>Paiement: ${vente.paiement || ""}</p>`;

    html += `<hr style="border-top:1px dashed black;">`;

    // ======================
    // FOOTER
    // ======================
    if (t.footerText) {
      html += `<p>${t.footerText.replace(/\n/g, "<br>")}</p>`;
    }

    html += `</div>`;

    document.getElementById("ticketZone").innerHTML = html;

  } catch (err) {
    console.error(err);
    alert("Erreur chargement ticket");
  }
}


// ==========================
// 🖨️ IMPRIMER
// ==========================
function printTicketFromDiv() {

  const content = document.getElementById("ticketZone").innerHTML;

  let w = window.open("", "_blank");

  w.document.open();

  w.document.write(`
    <html>
    <head>
      <title>Ticket</title>
      <style>
        body { font-family: monospace; text-align:center; }
        img { max-width: 100px; }
      </style>
    </head>
    <body onload="window.print()">
      ${content}
    </body>
    </html>
  `);

  w.document.close();

  // ❌ SUPPRIMÉ : ancien console.log cassé (vente n'existe pas ici)
}


// ==========================
// 🖨️ IMPRIMER (FIX STABLE)
// ==========================
function printTicketFromDiv() {

  let content = document.getElementById("ticketZone").innerHTML;

  let w = window.open("", "_blank");

  w.document.open();

  w.document.write(`
    <html>
    <head>
      <title>Ticket</title>
      <style>
        body { font-family: monospace; text-align:center; }
        img { max-width: 100px; }
      </style>
    </head>
    <body onload="window.print()">
      ${content}
    </body>
    </html>
  `);

console.log("VENTE COMPLETE:", vente);
console.log("TICKET:", vente.ticket);
console.log("LOGO:", vente.ticket?.logo);
console.log("TYPE LOGO:", typeof vente.ticket?.logo);



  w.document.close();
}