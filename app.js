// app.js
// Import module yang diperlukan
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const connection = require("./database/db");

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// execute query
function executeQuery(sql, values) {
  return new Promise((resolve, reject) => {
    connection.query(sql, values, (error, results) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(results);
    });
  });
}

// Routes
// Endpoint untuk mendapatkan semua data penjualan
app.get("/api/sales", async (req, res) => {
  try {
    // Lakukan pengambilan semua data penjualan dari database
    const sqlGetSales = `SELECT * FROM penjualan`;
    const sales = await executeQuery(sqlGetSales);

    res.status(200).json(sales);
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint untuk membuat penjualan
app.post("/api/sales", async (req, res) => {
  // Dapatkan data dari body request
  const { no_faktur, tanggal_faktur, nama_customer, grand_total } = req.body;

  try {
    // Lakukan penyimpanan data penjualan ke dalam database
    const sqlInsertPenjualan = `INSERT INTO penjualan (no_faktur, tanggal_faktur, nama_customer, grand_total) VALUES (?, ?, ?, ?)`;
    await executeQuery(sqlInsertPenjualan, [
      no_faktur,
      tanggal_faktur,
      nama_customer,
      grand_total,
    ]);

    res.status(201).send("Data penjualan berhasil ditambahkan");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint untuk menambahkan item penjualan
app.post("/api/sales/:id/items", async (req, res) => {
  // Dapatkan data dari body request
  const { nama_barang, qty_barang, price } = req.body;
  const idPenjualan = req.params.id; // Ambil id penjualan dari URL

  try {
    // Pastikan qty_barang dan price memiliki nilai numerik yang valid
    const qty = parseFloat(qty_barang);
    const itemPrice = parseFloat(price);

    if (isNaN(qty) || isNaN(itemPrice)) {
      throw new Error(
        "Invalid quantity or price. Check if the values are numeric."
      );
    }

    // Hitung total price dari item penjualan
    const totalPrice = qty * itemPrice;

    // Lakukan penyimpanan data item penjualan ke dalam database
    const sqlInsertItem = `INSERT INTO detail_penjualan (id_penjualan, nama_barang, qty_barang, price, total_price) VALUES (?, ?, ?, ?, ?)`;
    await executeQuery(sqlInsertItem, [
      idPenjualan,
      nama_barang,
      qty,
      itemPrice,
      totalPrice,
    ]);

    // Ambil semua item penjualan terkait dengan penjualan tertentu
    const sqlGetItems = `SELECT total_price FROM detail_penjualan WHERE id_penjualan = ?`;
    const items = await executeQuery(sqlGetItems, [idPenjualan]);

    // Hitung total harga semua item penjualan
    let grandTotal = 0;
    items.forEach((item) => {
      grandTotal += item.total_price;
    });

    // Perbarui nilai grand_total di tabel penjualan
    const sqlUpdateGrandTotal = `UPDATE penjualan SET grand_total = ? WHERE id_penjualan = ?`;
    await executeQuery(sqlUpdateGrandTotal, [grandTotal, idPenjualan]);

    res.status(201).send("Item penjualan berhasil ditambahkan");
  } catch (error) {
    console.error("Error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Endpoint untuk mengedit penjualan
app.put("/api/sales/:id", async (req, res) => {
  // Dapatkan data dari body request
  const { no_faktur, tanggal_faktur, nama_customer, grand_total } = req.body;
  const idPenjualan = req.params.id; // Ambil id penjualan dari URL

  try {
    // Lakukan pembaruan data penjualan di dalam database
    const sqlUpdateSale = `UPDATE penjualan SET no_faktur = ?, tanggal_faktur = ?, nama_customer = ?, grand_total = ? WHERE id_penjualan = ?`;
    await executeQuery(sqlUpdateSale, [
      no_faktur,
      tanggal_faktur,
      nama_customer,
      grand_total,
      idPenjualan,
    ]);

    res.status(200).send("Data penjualan berhasil diperbarui");
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Endpoint untuk mengedit item penjualan
app.put("/api/sales/:id/items/:itemId", async (req, res) => {
  // Dapatkan data dari body request
  const { nama_barang, qty_barang, price } = req.body;
  const idPenjualan = req.params.id; // Ambil id penjualan dari URL
  const itemId = req.params.itemId; // Ambil id item penjualan dari URL

  try {
    // Pastikan qty_barang dan price memiliki nilai numerik yang valid
    const qty = parseFloat(qty_barang);
    const itemPrice = parseFloat(price);

    if (isNaN(qty) || isNaN(itemPrice)) {
      throw new Error(
        "Invalid quantity or price. Check if the values are numeric."
      );
    }

    // Hitung total price dari item penjualan yang diperbarui
    const totalPrice = qty * itemPrice;

    // Lakukan pembaruan data item penjualan di dalam database
    const sqlUpdateItem = `UPDATE detail_penjualan SET nama_barang = ?, qty_barang = ?, price = ?, total_price = ? WHERE id_penjualan = ? AND id_detail_penjualan = ?`;
    await executeQuery(sqlUpdateItem, [
      nama_barang,
      qty,
      itemPrice,
      totalPrice,
      idPenjualan,
      itemId,
    ]);

    res.status(200).send("Item penjualan berhasil diperbarui");
  } catch (error) {
    console.error("Error:", error.message);
    res.status(400).json({ error: error.message });
  }
});

// Endpoint untuk menghapus penjualan beserta semua item penjualannya
app.delete("/api/sales/:id", async (req, res) => {
  const idPenjualan = req.params.id; // Ambil id penjualan dari URL

  try {
    // Hapus semua item penjualan terkait dengan penjualan yang akan dihapus
    const sqlDeleteItems = `DELETE FROM detail_penjualan WHERE id_penjualan = ?`;
    await executeQuery(sqlDeleteItems, [idPenjualan]);

    // Hapus penjualan itu sendiri dari tabel penjualan
    const sqlDeleteSale = `DELETE FROM penjualan WHERE id_penjualan = ?`;
    await executeQuery(sqlDeleteSale, [idPenjualan]);

    res.status(200).send("Penjualan beserta itemnya berhasil dihapus");
  } catch (error) {
    console.error("Error:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
