package service

import (
	"database/sql"
	"encoding/csv"
	"fmt"
	"github.com/gin-gonic/gin"
	"hamlog/app/config/yaml"
	"hamlog/app/model"
	"hamlog/app/utils"
	"os"
	"strconv"
	"time"
)

type LogInterface interface {
	// 列出所有日志
	LogList(current uint, pageSize uint)
	// 添加一条日志
	LogAdd(log model.Log)
	// 删除一条日志
	LogDelete(logId string)
	// 修改一条日志
	LogEdit(log model.Log, logId string)
	// 导出日志
	LogOutput(format string)
	// 导入日志
	LogInput(logs []model.Log, userId int) (string, error)
}

type LogService struct {
}

// 导入一条日志
func (u *LogService) LogInput(logs []model.Log, userId int) (string, error) {
	if len(logs) == 0 {
		return "无数据导入", nil
	}
	DB, _ := yaml.GetDatabase()
	tx, err := DB.Begin()
	if err != nil {
		return "开启事务失败", err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()
	insertSQL := `INSERT INTO log 
	(date, endate, tosign, fromsign, frequency, band, method, tosignal, fromsignal, topower, frompower, toantenna, fromantenna, todevice, fromdevice, toqth, fromqth, duration, content, country, fromcountry, user_id) 
	VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

	stmt, err := tx.Prepare(insertSQL)
	if err != nil {
		return "预编译语句失败", err
	}
	defer stmt.Close()

	for i := range logs {
		// 加密敏感字段
		encryptFields := []struct {
			field *string
			name  string
		}{
			{&logs[i].ToSign, "呼号"},
			{&logs[i].FromSign, "对方呼号"},
			{&logs[i].ToAntenna, "天线信息"},
			{&logs[i].FromAntenna, "对方天线信息"},
			{&logs[i].Content, "通信内容"},
			{&logs[i].ToQTH, "位置信息"},
			{&logs[i].FromQTH, "对方位置信息"},
		}
		for _, f := range encryptFields {
			if *f.field != "" {
				*f.field, err = utils.EncryptString(*f.field)
				if err != nil {
					return "", fmt.Errorf("%s加密失败: %v", f.name, err)
				}
			}
		}

		// 计算duration
		startTime, err1 := time.Parse("2006-01-02 15:04:05", logs[i].Date)
		endTime, err2 := time.Parse("2006-01-02 15:04:05", logs[i].EnDate)
		var duration time.Duration
		if err1 == nil && err2 == nil {
			duration = endTime.Sub(startTime)
		} else {
			duration = 0
		}

		// 如果country为空，用解密后的呼号去数据库查询
		if logs[i].Country == "" {
			decryptedSign, err := utils.DecryptString(logs[i].ToSign)
			if err == nil {
				query := "SELECT country FROM cty WHERE ? LIKE CONCAT(name, '%') ORDER BY LENGTH(name) DESC LIMIT 1"
				row := tx.QueryRow(query, decryptedSign)
				var country string
				if err := row.Scan(&country); err == nil {
					logs[i].Country = country
				}
			}
		}

		userId := userId
		logs[i].UserId = userId
		_, err = stmt.Exec(
			logs[i].Date,
			logs[i].EnDate,
			logs[i].ToSign,
			logs[i].FromSign,
			logs[i].Frequency,
			logs[i].Band,
			logs[i].Method,
			logs[i].ToSignal,
			logs[i].FromSignal,
			logs[i].ToPower,
			logs[i].FromPower,
			logs[i].ToAntenna,
			logs[i].FromAntenna,
			logs[i].ToDevice,
			logs[i].FromDevice,
			logs[i].ToQTH,
			logs[i].FromQTH,
			int(duration.Seconds()),
			logs[i].Content,
			logs[i].Country,
			logs[i].FromCountry,
			logs[i].UserId,
		)
		if err != nil {
			return "插入失败", err
		}
	}
	return "导入成功", nil
}

// 导出一条日志
func (u *LogService) LogOutput(format string, context *gin.Context) (string, error) {
	DB, _ := yaml.GetDatabase()
	userId := context.GetInt("user_id")
	rows, err := DB.Query("SELECT * FROM log WHERE user_id = ?", userId)
	if err != nil {
		return "查询失败！", fmt.Errorf("查询失败: %v", err)
	}
	defer rows.Close()

	if format == "csv" {
		currentTime := time.Now().Format("2006-01-02-15-04-05")
		outputDir := "output"
		fileName := fmt.Sprintf("%s/%s.csv", outputDir, currentTime)

		if _, err := os.Stat(outputDir); os.IsNotExist(err) {
			if err := os.Mkdir(outputDir, 0755); err != nil {
				return "创建输出目录失败！", err
			}
		}

		file, err := os.Create(fileName)
		if err != nil {
			return "创建CSV文件失败！", err
		}
		defer file.Close()

		writer := csv.NewWriter(file)
		defer writer.Flush()

		columns, err := rows.Columns()
		if err != nil {
			return "获取列名失败！", err
		}
		writer.Write(columns)

		// 需要解密的字段名集合（全部小写）
		decryptFieldSet := map[string]bool{
			"tosign":      true,
			"fromsign":    true,
			"toantenna":   true,
			"fromantenna": true,
			"content":     true,
			"toqth":       true,
			"fromqth":     true,
		}

		values := make([]interface{}, len(columns))
		valuePtrs := make([]interface{}, len(columns))

		for i := range columns {
			valuePtrs[i] = new(sql.RawBytes)
			values[i] = valuePtrs[i]
		}

		for rows.Next() {
			err := rows.Scan(values...)
			if err != nil {
				return "扫描行失败！", err
			}

			var row []string
			for i, col := range columns {
				rawValue := *(valuePtrs[i].(*sql.RawBytes))
				strValue := string(rawValue)

				// 如果字段是加密字段则尝试解密
				if decryptFieldSet[col] && strValue != "" {
					decrypted, err := utils.DecryptString(strValue)
					if err != nil {
						return "", fmt.Errorf("字段 %s 解密失败: %v", col, err)
					}
					strValue = decrypted
				}

				row = append(row, strValue)
			}

			writer.Write(row)
		}

		return fileName, nil
	} else if format == "adi" {
		return "懒得写捏", nil
	}
	return "懒得写捏", nil
}

// 删除一条日志
func (u *LogService) LogDelete(logId string) (string, error) {
	if logId == "" {
		return "删除失败，参数为空！", nil
	}
	DB, _ := yaml.GetDatabase()
	query := "DELETE FROM log WHERE id = ?"
	_, err := DB.Exec(query, logId)
	if err != nil {
		return "删除失败！", fmt.Errorf("错误信息 %v", err)
	}
	return "删除成功！", nil
}

// 编辑一条日志
func (u *LogService) LogEdit(log model.Log, logId string) (string, error) {
	DB, _ := yaml.GetDatabase()

	// 加密指定字段
	encryptFields := []struct {
		field *string
		name  string
	}{
		{&log.ToSign, "呼号"},
		{&log.FromSign, "对方呼号"},
		{&log.ToAntenna, "天线信息"},
		{&log.FromAntenna, "对方天线信息"},
		{&log.Content, "通信内容"},
		{&log.ToQTH, "位置信息"},
		{&log.FromQTH, "对方位置信息"},
	}

	for _, f := range encryptFields {
		if *f.field != "" {
			encrypted, err := utils.EncryptString(*f.field)
			if err != nil {
				return "", fmt.Errorf("%s加密失败: %v", f.name, err)
			}
			*f.field = encrypted
		}
	}

	query := `
		UPDATE log 
		SET date = ?, endate = ?, tosign = ?, fromsign = ?, frequency = ?, band = ?, method = ?, 
			tosignal = ?, fromsignal = ?, topower = ?, frompower = ?, 
			toantenna = ?, fromantenna = ?, todevice = ?, fromdevice = ?, 
			toqth = ?, fromqth = ?, content = ?, country = ?, fromcountry = ? 
		WHERE id = ?;
	`

	_, err := DB.Exec(query,
		log.Date, log.EnDate, log.ToSign, log.FromSign, log.Frequency, log.Band, log.Method,
		log.ToSignal, log.FromSignal, log.ToPower, log.FromPower,
		log.ToAntenna, log.FromAntenna, log.ToDevice, log.FromDevice,
		log.ToQTH, log.FromQTH, log.Content, log.Country, log.FromCountry, logId,
	)

	if err != nil {
		return "编辑失败！", fmt.Errorf("数据库更新错误: %v", err)
	}

	return "ok", nil
}

// 添加一条日志
func (u *LogService) LogAdd(log model.Log, context *gin.Context) (string, error) {
	userId := context.GetInt("user_id")
	DB, _ := yaml.GetDatabase()
	// 加密敏感字段
	var err error
	encryptFields := []struct {
		field *string
		name  string
	}{
		{&log.ToSign, "呼号"},
		{&log.FromSign, "对方呼号"},
		{&log.ToAntenna, "天线信息"},
		{&log.FromAntenna, "对方天线信息"},
		{&log.Content, "通信内容"},
		{&log.ToQTH, "位置信息"},
		{&log.FromQTH, "对方位置信息"},
	}
	for _, f := range encryptFields {
		if *f.field != "" {
			*f.field, err = utils.EncryptString(*f.field)
			if err != nil {
				return "", fmt.Errorf("%s加密失败: %v", f.name, err)
			}
		}
	}
	if log.Country == "" {
		decryptedSign, err := utils.DecryptString(log.ToSign)
		if err != nil {
			return "", fmt.Errorf("呼号解密失败: %v", err)
		}
		query := "SELECT * FROM cty WHERE ? LIKE CONCAT(name, '%') ORDER BY LENGTH(name) DESC LIMIT 1;"
		rowsAddress, _ := DB.Query(query, decryptedSign)
		defer rowsAddress.Close()
		for rowsAddress.Next() {
			var address model.Address
			err := rowsAddress.Scan(&address.Id, &address.Name, &address.Country, &address.Prefix, &address.Adif, &address.CQzone,
				&address.Ituzone, &address.Continent, &address.Latitude, &address.Longitude, &address.Gmtoffset, &address.ExactCallSign)
			if err != nil {
				return "读取数据库地址行失败", fmt.Errorf("读取数据库地址行失败: %v", err)
			}
			log.Country = address.Country
		}
	}
	query := "INSERT INTO log (date, endate, tosign, fromsign, frequency, band, method, tosignal, fromsignal, topower, frompower, toantenna, fromantenna, todevice, fromdevice, toqth, fromqth, duration, content, country, fromcountry, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
	StartDate, _ := time.Parse("2006-01-02 15:04:05", log.Date)
	EndDate, _ := time.Parse("2006-01-02 15:04:05", log.EnDate)
	Duration := EndDate.Sub(StartDate)
	_, err = DB.Exec(query, log.Date, log.EnDate, log.ToSign, log.FromSign, log.Frequency, log.Band, log.Method,
		log.ToSignal, log.FromSignal, log.ToPower, log.FromPower, log.ToAntenna, log.FromAntenna,
		log.ToDevice, log.FromDevice, log.ToQTH, log.FromQTH, Duration/time.Second, log.Content,
		log.Country, log.FromCountry, userId)

	if err != nil {
		return "添加失败！", fmt.Errorf("错误信息 %v", err)
	}
	return "添加成功！", nil
}

// 查询所有日志
func (u *LogService) LogList(current string, pageSize string, date string, toSign string, method string, frequency string, band string, toQTH string, content string, UserId int) ([]model.Log, int, error) {
	DB, _ := yaml.GetDatabase()

	// 参数转换与验证
	currentPage, err := strconv.Atoi(current)
	if err != nil {
		return nil, 0, fmt.Errorf("解析当前页失败: %v", err)
	}
	pageSizeInt, err := strconv.Atoi(pageSize)
	if err != nil {
		return nil, 0, fmt.Errorf("解析每页大小失败: %v", err)
	}
	offset := (currentPage - 1) * pageSizeInt

	// 构建查询语句
	query := "SELECT * FROM log WHERE 1 = 1"
	queryParams := []interface{}{}
	fmt.Println(UserId)
	query += " AND user_id = ?"
	queryParams = append(queryParams, UserId)

	// 处理加密字段的查询条件
	if toSign != "" {
		encryptedSign, err := utils.EncryptString(toSign)
		if err != nil {
			return nil, 0, fmt.Errorf("呼号加密失败: %v", err)
		}
		query += " AND toSign LIKE CONCAT('%', ?, '%')"
		queryParams = append(queryParams, encryptedSign)
	}

	if toQTH != "" {
		encryptedQTH, err := utils.EncryptString(toQTH)
		if err != nil {
			return nil, 0, fmt.Errorf("位置信息加密失败: %v", err)
		}
		query += " AND toQTH LIKE CONCAT('%', ?, '%')"
		queryParams = append(queryParams, encryptedQTH)
	}

	if content != "" {
		encryptedContent, err := utils.EncryptString(content)
		if err != nil {
			return nil, 0, fmt.Errorf("内容加密失败: %v", err)
		}
		query += " AND content LIKE CONCAT('%', ?, '%')"
		queryParams = append(queryParams, encryptedContent)
	}

	// 处理非加密字段的查询条件
	if date != "" {
		query += " AND date = ?"
		queryParams = append(queryParams, date)
	}
	if method != "" {
		query += " AND method = ?"
		queryParams = append(queryParams, method)
	}
	if frequency != "" {
		query += " AND frequency = ?"
		queryParams = append(queryParams, frequency)
	}
	if band != "" {
		query += " AND band = ?"
		queryParams = append(queryParams, band)
	}

	// 添加分页条件
	query += " ORDER BY id DESC LIMIT ? OFFSET ?"
	queryParams = append(queryParams, pageSizeInt, offset)

	// 执行查询
	rows, err := DB.Query(query, queryParams...)
	if err != nil {
		return nil, 0, fmt.Errorf("数据库查询失败: %v", err)
	}
	defer rows.Close()

	var logs []model.Log
	for rows.Next() {
		var log model.Log
		err := rows.Scan(
			&log.ID,
			&log.Date,
			&log.EnDate,
			&log.ToSign,
			&log.FromSign,
			&log.Frequency,
			&log.Band,
			&log.Method,
			&log.ToSignal,
			&log.FromSignal,
			&log.ToPower,
			&log.FromPower,
			&log.ToAntenna,
			&log.FromAntenna,
			&log.ToDevice,
			&log.FromDevice,
			&log.ToQTH,
			&log.FromQTH,
			&log.Duration,
			&log.Content,
			&log.Country,
			&log.FromCountry,
			&log.UserId,
		)
		if err != nil {
			return nil, 0, fmt.Errorf("读取数据库行失败: %v", err)
		}

		// 解密加密字段
		decryptFields := []struct {
			field *string
			name  string
		}{
			{&log.ToSign, "呼号"},
			{&log.FromSign, "对方呼号"},
			{&log.ToAntenna, "天线信息"},
			{&log.FromAntenna, "对方天线信息"},
			{&log.Content, "通信内容"},
			{&log.ToQTH, "位置信息"},
			{&log.FromQTH, "对方位置信息"},
		}

		for _, f := range decryptFields {
			if *f.field != "" {
				decrypted, err := utils.DecryptString(*f.field)
				if err != nil {
					return nil, 0, fmt.Errorf("%s解密失败: %v", f.name, err)
				}
				*f.field = decrypted
			}
		}

		// 查询地址信息（使用解密后的呼号）
		query := "SELECT * FROM cty WHERE ? LIKE CONCAT(name, '%') ORDER BY LENGTH(name) DESC LIMIT 1;"
		rowsAddress, err := DB.Query(query, log.ToSign)
		if err != nil {
			return nil, 0, fmt.Errorf("地址查询失败: %v", err)
		}
		defer rowsAddress.Close()

		for rowsAddress.Next() {
			var address model.Address
			err := rowsAddress.Scan(&address.Id, &address.Name, &address.Country, &address.Prefix, &address.Adif,
				&address.CQzone, &address.Ituzone, &address.Continent, &address.Latitude,
				&address.Longitude, &address.Gmtoffset, &address.ExactCallSign)
			if err != nil {
				return nil, 0, fmt.Errorf("读取地址数据失败: %v", err)
			}
			log.Address = address
		}

		logs = append(logs, log)
	}

	// 获取总数（不包含查询条件，因为前端分页通常只需要总记录数）
	totalQuery := "SELECT COUNT(*) FROM log WHERE user_id = ?"
	var totalNum int
	err = DB.QueryRow(totalQuery, UserId).Scan(&totalNum)
	if err != nil {
		return nil, 0, fmt.Errorf("获取总数失败: %v", err)
	}

	return logs, totalNum, nil
}
