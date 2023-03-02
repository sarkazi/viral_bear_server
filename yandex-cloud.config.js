var EasyYandexS3 = require("easy-yandex-s3");
var s3 = new EasyYandexS3({
   auth: {
      accessKeyId: "YCAJE9VavEEX6lxxxmn5Zf9gf",
      secretAccessKey: "YCNN8SqgPoEf14LAsSfeVL8hJqC-G6YDL2cwSHrQ",
   },
   Bucket: "viralbear", // например, "my-storage",
   debug: false, // Дебаг в консоли, потом можете удалить в релизе
});

module.exports = s3