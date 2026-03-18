package service

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"hamlog/app/config/yaml"
	"hamlog/app/utils"
)

type DisplayData struct {
	// 统计通联QSO次数Top10
	Top10QSO []struct {
		Callsign string `json:"tosign"`
		Times    int    `json:"times"`
	} `json:"top10qso"`
	// 显示通联国家次数Top10
	Top10Country []struct {
		Country string `json:"country"`
		Times   int    `json:"times"`
	} `json:"top10country"`
	// 统计最常使用的波段
	Top10Band []struct {
		Band  string `json:"band"`
		Times int    `json:"times"`
	} `json:"top10band"`
	// 统计最常使用的方式
	Top10Method []struct {
		Method string `json:"method"`
		Times  int    `json:"times"`
	} `json:"top10method"`
	//
	CntCountries []struct {
		Date    string  `json:"date"`
		Country string  `json:"country"`
		Times   float64 `json:"times"`
	} `json:"cntcountries"`
	// 查询世界地图
	WorldMap []struct {
		FromSign   string `json:"fromsign"`
		ToSign     string `json:"tosign"`
		Method     string `json:"method"`
		Longitude1 string `json:"longitude1"`
		Latitude1  string `json:"latitude1"`
		Longitude2 string `json:"longitude2"`
		Latitude2  string `json:"latitude2"`
	} `json:"worldmap"`
	Cnt int `json:"cnt"`
}

type DisplayScreenInterface interface {
	DisplayScreen()
}

type DisplayScreenService struct {
}

// 大屏处理
func (u *DisplayScreenService) DisplayScreen(context *gin.Context) (DisplayData, error) {
	DB, _ := yaml.GetDatabase()
	userId := context.GetInt("user_id")
	// 统计通联QSO次数Top10
	fmt.Printf("userId: %s", userId)
	qsorows, err := DB.Query("SELECT tosign, COUNT(tosign) AS times FROM log WHERE user_id = ? GROUP BY tosign ORDER BY times DESC LIMIT 10;", userId)
	defer qsorows.Close()
	var displayData DisplayData
	for qsorows.Next() {
		var callsign string
		var times int
		err := qsorows.Scan(&callsign, &times)
		if err != nil {
			return DisplayData{}, err
		}
		callsign, _ = utils.DecryptString(callsign)
		qso := struct {
			Callsign string `json:"tosign"`
			Times    int    `json:"times"`
		}{
			Callsign: callsign,
			Times:    times,
		}
		displayData.Top10QSO = append(displayData.Top10QSO, qso)
	}
	// 统计次数
	var cnt int
	err = DB.QueryRow("SELECT count(*) as cnt FROM log WHERE user_id = ?", userId).Scan(&cnt)
	if err != nil {
		panic(err.Error())
	}
	displayData.Cnt = cnt
	// 显示通联国家次数Top10
	countryrows, err := DB.Query("SELECT country, COUNT(country) AS times FROM log WHERE user_id = ? GROUP BY country ORDER BY times DESC LIMIT 10;", userId)
	defer countryrows.Close()
	for countryrows.Next() {
		var country string
		var times int
		err := countryrows.Scan(&country, &times)
		if err != nil {
			return DisplayData{}, err
		}
		qso := struct {
			Country string `json:"country"`
			Times   int    `json:"times"`
		}{
			Country: country,
			Times:   times,
		}
		displayData.Top10Country = append(displayData.Top10Country, qso)
	}
	// 显示世界地图
	logrows, err := DB.Query("SELECT fromsign, tosign, method FROM log WHERE user_id = ?", userId)
	if err != nil {
		return DisplayData{}, err
	}
	defer logrows.Close()

	type RawLog struct {
		FromSign string
		ToSign   string
		Method   string
	}
	var rawLogs []RawLog

	for logrows.Next() {
		var from, to, method string
		if err := logrows.Scan(&from, &to, &method); err != nil {
			return DisplayData{}, err
		}
		from, _ = utils.DecryptString(from)
		to, _ = utils.DecryptString(to)
		rawLogs = append(rawLogs, RawLog{FromSign: from, ToSign: to, Method: method})
	}
	for _, log := range rawLogs {
		var c1name, c2name string
		DB.QueryRow(`SELECT name FROM cty WHERE ? LIKE CONCAT(name, '%') ORDER BY LENGTH(name) DESC LIMIT 1`, log.FromSign).Scan(&c1name)
		DB.QueryRow(`SELECT name FROM cty WHERE ? LIKE CONCAT(name, '%') ORDER BY LENGTH(name) DESC LIMIT 1`, log.ToSign).Scan(&c2name)

		var lon1, lat1, lon2, lat2 string
		DB.QueryRow(`SELECT ABS(longitude), latitude FROM cty WHERE name = ?`, c1name).Scan(&lon1, &lat1)
		DB.QueryRow(`SELECT ABS(longitude), latitude FROM cty WHERE name = ?`, c2name).Scan(&lon2, &lat2)

		Communication := struct {
			FromSign   string `json:"fromsign"`
			ToSign     string `json:"tosign"`
			Method     string `json:"method"`
			Longitude1 string `json:"longitude1"`
			Latitude1  string `json:"latitude1"`
			Longitude2 string `json:"longitude2"`
			Latitude2  string `json:"latitude2"`
		}{
			FromSign:   log.FromSign,
			ToSign:     log.ToSign,
			Method:     log.Method,
			Longitude1: lon1,
			Latitude1:  lat1,
			Longitude2: lon2,
			Latitude2:  lat2,
		}
		displayData.WorldMap = append(displayData.WorldMap, Communication)
	}
	// 统计最常使用的波段
	bandrow, err := DB.Query("SELECT band, count(band) as times FROM log WHERE user_id = ? GROUP BY band ORDER BY count(band) DESC LIMIT 10", userId)
	defer bandrow.Close()
	for bandrow.Next() {
		var band string
		var times int
		err := bandrow.Scan(&band, &times)
		if err != nil {
			return DisplayData{}, err
		}
		bands := struct {
			Band  string `json:"band"`
			Times int    `json:"times"`
		}{
			Band:  band,
			Times: times,
		}
		displayData.Top10Band = append(displayData.Top10Band, bands)
	}
	// 统计最常使用的方式
	methodrow, err := DB.Query("SELECT method, count(method) as times FROM log WHERE user_id = ? GROUP BY method ORDER BY count(method) DESC LIMIT 10", userId)
	defer methodrow.Close()
	for methodrow.Next() {
		var method string
		var times int
		err := methodrow.Scan(&method, &times)
		if err != nil {
			return DisplayData{}, err
		}
		methods := struct {
			Method string `json:"method"`
			Times  int    `json:"times"`
		}{
			Method: method,
			Times:  times,
		}
		displayData.Top10Method = append(displayData.Top10Method, methods)
	}
	// 根据时间统计国家出现的次数
	countryrow, err := DB.Query(`
		SELECT 
			DATE(date) AS date,
			country,
			COUNT(*) + RAND() AS times
		FROM 
			log
		WHERE
			user_id = ?
		GROUP BY 
			DATE(date), country;
	`, userId)
	defer countryrow.Close()
	for countryrow.Next() {
		var date string
		var country string
		var times float64
		err := countryrow.Scan(&date, &country, &times)
		if err != nil {
			return DisplayData{}, err
		}
		countries := struct {
			Date    string  `json:"date"`
			Country string  `json:"country"`
			Times   float64 `json:"times"`
		}{
			Date:    date,
			Country: country,
			Times:   times,
		}
		displayData.CntCountries = append(displayData.CntCountries, countries)
	}
	// 报错输出
	if err != nil {
		return DisplayData{}, err
	}
	// 最后返回的结果
	return displayData, nil
}
