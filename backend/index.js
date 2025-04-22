const express = require("express");
const bodyParser = require("body-parser");
const { spawn } = require("child_process");
const cors = require("cors");
const axios = require("axios");
require("dotenv").config();
const { LocalStorage } = require("node-localstorage");
const localStorage = new LocalStorage("./scratch");

const app = express();
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// 🔹 CORS Configuration (Adjust for Production)
app.use(cors({
  origin: ['http://localhost:3000'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));

app.get("/", (req, res) => {
  res.send("App is working..");
});

// 🔹 Fetch stock data using Alpha Vantage
app.post("/getStockData", async (req, res) => {
  try {
    const { stockSymbol } = req.body;
    
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY || "demo";
    
    if (!stockSymbol) {
      return res.status(400).json({ success: false, error: "Stock symbol is required" });
    }

    const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=demo`;
    

    const response = await axios.get(apiUrl);
    console.log("API Response:", response.data);

    if (response.data["Time Series (Daily)"]) {
      res.json({ success: true, data: response.data["Time Series (Daily)"] });
    } else {
      console.log(apiKey);
      res.status(400).json({ success: false, error: "Invalid stock symbol or API limit reached" });
    }
  } catch (error) {
    console.error("Error fetching stock data:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// 🔹 Fetch news from RapidAPI
app.post("/getnewsrapidapi", async (req, res) => {
  try {
    const options = {
      method: "GET",
      url: process.env.NEWS_API,
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": process.env.RAPIDAPI_HOST,
      },
    };

    const response = await axios.request(options);
    res.json({ news: response.data });
  } catch (error) {
    console.error("Error fetching news:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// 🔹 Fetch financial news from Financial Modeling Prep API
app.post("/getnews", async (req, res) => {
  try {
    const apiKey = process.env.FINANCIALMODELAPI;
    const page = Math.floor(Math.random() * 10); // 0–9

    const apiUrl = `https://www.alphavantage.co/query?function=TIME_SERIES_DAILY&symbol=IBM&apikey=demo`;
    const response = await axios.get(apiUrl);
   

    res.status(200).json({ success: true, news: response.data });
  } catch (error) {
    console.error("Error fetching news:", error.message);
    res.status(500).json({ success: false, error: "Error fetching news" });
  }
});

// 🔹 Predict stock prices using Python script
app.post("/predictstock/:startdate/:enddate/:stocksymbol", async (req, res) => {
  const { startdate: startDate, enddate: endDate, stocksymbol: stockSymbol } = req.params;

  try {
    const combinedArgs = [startDate, endDate, stockSymbol].join(",");
    const pythonProcess = spawn("python", ["get_stockdata.py", combinedArgs]);

    let pythonOutput = "";

    pythonProcess.stdout.on("data", (data) => {
      if (data.toString()[0] === "[" && data.toString()[1] === "[") {
        pythonOutput += data.toString();
      }
    });

    pythonProcess.stderr.on("data", (data) => {
      console.error(`Python stderr: ${data}`);
    });

    pythonProcess.on("close", (code) => {
      if (code === 0) {
        const parsedArray = pythonOutput.slice(2, -2).split("], [").map(inner => inner.split(",").map(Number));
        res.json({ success: true, predictionDataInJSON: parsedArray });
      } else {
        res.status(500).send("Error running the Python script");
      }
    });
  } catch (error) {
    console.error("Error in stock prediction:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// 🔹 Fetch stock search results & news sentiment from Alpha Vantage
app.get("/alpha", async (req, res) => {
  try {
    const apiKey = process.env.ALPHA_VANTAGE_API_KEY;
    const newsApiKey = process.env.ALPHA_VANTAGE_NEWS_API_KEY;
    const topics = "financial_markets";

    const apiUrl = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&topics=${topics}&apikey=${apiKey}`;
    const response = await axios.get(apiUrl);

    res.send(response.data);
  } catch (error) {
    console.error("Error fetching Alpha Vantage news:", error.message);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

app.listen(3001, () => {
  console.log("Server started on port 3001...");
});
