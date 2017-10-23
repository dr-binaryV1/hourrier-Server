const cheerio = require('cheerio');
const request = require('request');
const fs = require('fs');
const scraper = require('product-scraper');

exports.scrape = (req, res, next) => {
  // const url = 'https://www.amazon.com/Apple-iPhone-Unlocked-Certified-Refurbished/dp/B01N9YV6DL/ref=sr_1_1_sspa?s=wireless&ie=UTF8&qid=1508687314&sr=1-1-spons&keywords=iphone+8&psc=1&smid=A29UTA6YQ2YK7E';
  //
  // request(url, (err, response, html) => {
  //   //Check to ensure there is no errors
  //   if(!err) {
  //
  //     // Instantiate Cheerio library on the returned html to enable jQuery functionality
  //     const $ = cheerio.load(html);
  //
  //     let name, price, wght;
  //     let json = {
  //       name: '',
  //       price: '',
  //       weight: ''
  //     };
  //
  //     console.log(html);
  //     $('#title').filter(function(){
  //       const data = $(this);
  //       name = data.children().first().text();
  //
  //       json.name = name.trim();
  //     });
  //     res.json(json);
  //   }
  // });

  scraper.init(req.body.url, function(data){
    res.json(data);
  });
}
