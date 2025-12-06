// format_array_images.js

function formatArrayImages(input) {
  // input est une STRING venant de Make.
  // Elle peut être :
  // - un objet unique  : {"Image":[...]} 
  // - plusieurs objets collés : {"Image":[...]},{"Image":[...]}
  // - un tableau JSON : [ {...}, {...} ]
  // - un résultat d'Array aggregator : [ { "array": [ {...}, {...} ], "__IMTAGGLENGTH__": 2 } ]

  let raw = (input || "").trim();
  if (!raw) {
    return "";
  }

  let data;

  // 1) On essaie de parser tel quel
  try {
    data = JSON.parse(raw);
  } catch (e1) {
    // 2) Sinon, on tente en l'encadrant par [ ... ]
    try {
      data = JSON.parse("[" + raw + "]");
    } catch (e2) {
      // Si ça ne passe toujours pas, on arrête proprement
      return "";
    }
  }

  // 3) On normalise en tableau
  let items;
  if (Array.isArray(data)) {
    items = data;
  } else {
    items = [data];
  }

  // 4) Cas typique de l'Array Aggregator :
  // [ { array: [ {Image: [...]}, {Image: [...] } ], "__IMTAGGLENGTH__": 2 } ]
  if (items.length === 1 && items[0] && Array.isArray(items[0].array)) {
    items = items[0].array;
  }

  // 5) Si certains éléments ont encore un champ "array", on les aplatit
  items = items.flatMap(el => {
    if (el && Array.isArray(el.array)) {
      return el.array;
    }
    return [el];
  });

  // 6) Construction des blocs input_image
  const blocks = [];

  for (const item of items) {
    if (!item) continue;

    // On récupère le champ Image (ou image, au cas où)
    let images = item.Image || item.image;
    if (!images) continue;

    // On force en tableau
    if (!Array.isArray(images)) {
      images = [images];
    }

    const img = images[0];
    if (!img) continue;

    const url = img.url || img.URL;
    if (!url) continue;

    blocks.push({
      type: "input_image",
      image_url: url
    });
  }

  // 7) On renvoie un texte : objets JSON séparés par une virgule
  if (!blocks.length) {
    return "";
  }

  return blocks.map(b => JSON.stringify(b)).join(",");
}

// Export pour Node (VPS, require, etc.)
if (typeof module !== "undefined") {
  module.exports = { formatArrayImages };
}

// Compatibilité Make : si le moteur définit une variable globale `input`,
// on renvoie directement le résultat comme avant.
if (typeof input !== "undefined") {
  return formatArrayImages(input);
}