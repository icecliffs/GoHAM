package controllers

import (
	"encoding/csv"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"hamlog/app/model"
	"hamlog/app/service"
	"net/http"
	"regexp"
	"strings"
	"time"
)

// 分页结构体
type PaginationQ struct {
	Code    string `json:"code"`
	Data    string `json:"data"`
	Success string `json:"success"'`
	Message string `json:"message"`
	Page    uint   `json:"page"`
	Total   uint   `json:"total"`
}

// 展示日志
func (uc *LogController) LogList(context *gin.Context) {
	Current := context.Query("current")
	PageSize := context.Query("pageSize")
	Date := context.Query("date")
	ToSign := context.Query("tosign")
	Method := context.Query("method")
	Frequency := context.Query("frequency")
	Band := context.Query("band")
	ToQTH := context.Query("toqth")
	Content := context.Query("content")
	UserId := context.GetInt("user_id")
	// 正常获取
	logs, total, err := service.LogServices.LogList(Current, PageSize, Date, ToSign, Method, Frequency, Band, ToQTH, Content, UserId)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "查询成功！",
		"data":    logs,
		"page":    Current,
		"total":   total,
	})
}

// 日志控制层结构体
type LogController struct {
	logService       service.LogInterface
	logServiceUpload *service.LogService
}

// 匹配字段
func getField(line string) string {
	return strings.Split(strings.Split(line, ">")[1], "<")[0]
}

// 日志匹配
func parseAdiFile(content []string) []model.QSO {
	var qsoList []model.QSO
	var currentQSO model.QSO
	for _, line := range content {
		line = strings.ToUpper(strings.TrimSpace(line))
		switch {
		case line == "<EOH>":
			currentQSO = model.QSO{}
		case strings.HasPrefix(line, "<CALL:"):
			currentQSO.Call = getField(line)
		case strings.HasPrefix(line, "<QSO_DATE:"):
			currentQSO.QsoDate = getField(line)
		case strings.HasPrefix(line, "<TIME_ON:"):
			currentQSO.TimeOn = getField(line)
		case strings.HasPrefix(line, "<TIME_OFF:"):
			currentQSO.TimeOff = getField(line)
		case strings.HasPrefix(line, "<BAND:"):
			currentQSO.Band = getField(line)
		case strings.HasPrefix(line, "<FREQ:"):
			currentQSO.Frequency = getField(line)
		case strings.HasPrefix(line, "<MODE:"):
			currentQSO.Mode = getField(line)
		case strings.HasPrefix(line, "<RST_SENT:"):
			currentQSO.RstSent = getField(line)
		case strings.HasPrefix(line, "<RST_RCVD:"):
			currentQSO.RstRcvd = getField(line)
		case strings.HasPrefix(line, "<DXCC:"):
			currentQSO.Dxcc = getField(line)
		case strings.HasPrefix(line, "<CQZ:"):
			currentQSO.Cqz = getField(line)
		case strings.HasPrefix(line, "<ITUZ:"):
			currentQSO.Ituz = getField(line)
		case strings.HasPrefix(line, "<CONT:"):
			currentQSO.Cont = getField(line)
		case strings.HasPrefix(line, "<MY_GRIDSQUARE:"):
			currentQSO.Gridsquare = getField(line)
		case line == "<EOR>":
			qsoList = append(qsoList, currentQSO)
		}
	}
	return qsoList
}

// 日志编辑
func (uc *LogController) LogEdit(context *gin.Context) {
	logId := context.Query("id")
	logData := model.Log{}
	err := context.BindJSON(&logData)
	if err != nil {
		return
	}
	logs, err := service.LogServices.LogEdit(logData, logId)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"code":    http.StatusInternalServerError,
			"message": err.Error(),
		})
		return
	}
	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "修改成功！",
		"data":    logs,
	})
}

// 日志删除
func (uc *LogController) LogDelete(context *gin.Context) {
	logId := context.Query("id")
	logs, err := service.LogServices.LogDelete(logId)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "查询成功！",
		"data":    logs,
	})
}

func transformLine(line string) string {
	re := regexp.MustCompile(`<(\w+:\d+)>(\S+)`)
	transformed := re.ReplaceAllString(line, "<$1>$2\n")
	return strings.ToUpper(transformed)
}

// 生成新的文件名
func generateNewFileName(fileName string) string {
	// 获取现在的时间
	timestamp := time.Now().Format("2006-01-02")
	uuid := uuid.New().String()
	// 获取文件后缀
	fileExt := getFileExtension(fileName)
	newFileName := fmt.Sprintf("%s-%s.%s", timestamp, uuid, fileExt)
	return newFileName
}

// 获取文件后缀
func getFileExtension(fileName string) string {
	splitName := strings.Split(fileName, ".")
	if len(splitName) > 1 {
		return strings.ToLower(splitName[len(splitName)-1])
	}
	return ""
}

// 日志导入
func (uc *LogController) LogInput(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to get uploaded file"})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to open uploaded file"})
		return
	}
	defer src.Close()

	reader := csv.NewReader(src)
	reader.TrimLeadingSpace = true

	// 读取所有记录
	records, err := reader.ReadAll()
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid CSV format"})
		return
	}

	if len(records) < 2 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "CSV must contain headers and at least one data row"})
		return
	}

	headers := records[0]
	var qsoList []model.Log

	for _, record := range records[1:] {
		if len(record) == 0 {
			continue
		}

		qso := model.Log{}

		for i, header := range headers {
			if i >= len(record) {
				continue
			}
			value := strings.TrimSpace(record[i])
			switch strings.TrimSpace(strings.ToLower(header)) {
			case "date":
				qso.Date = value
			case "endate":
				qso.EnDate = value
			case "tosign":
				qso.ToSign = value
			case "fromsign":
				qso.FromSign = value
			case "frequency":
				qso.Frequency = value
			case "band":
				qso.Band = value
			case "method":
				qso.Method = value
			case "tosignal":
				qso.ToSignal = value
			case "fromsignal":
				qso.FromSignal = value
			case "topower":
				qso.ToPower = value
			case "frompower":
				qso.FromPower = value
			case "toantenna":
				qso.ToAntenna = value
			case "fromantenna":
				qso.FromAntenna = value
			case "todevice":
				qso.ToDevice = value
			case "fromdevice":
				qso.FromDevice = value
			case "toqth":
				qso.ToQTH = value
			case "fromqth":
				qso.FromQTH = value
			case "duration":
				qso.Duration = value
			case "content":
				qso.Content = value
			case "country":
				qso.Country = value
			case "fromcountry":
				qso.FromCountry = value
			}
		}

		qsoList = append(qsoList, qso)
	}

	userId := c.GetInt("user_id")
	msg, err := uc.logServiceUpload.LogInput(qsoList, userId)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": msg})
}

// 日志导出
func (uc *LogController) LogOutput(context *gin.Context) {
	logFormat := context.Query("format")
	if logFormat == "csv" {
		logs, err := service.LogServices.LogOutput(logFormat, context)
		if err != nil {
			context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
			return
		}
		context.JSON(http.StatusOK, gin.H{
			"code":    http.StatusOK,
			"message": "生成成功！",
			"data":    logs,
		})
	} else if logFormat == "adi" {

	}
}

// 日志添加
func (uc *LogController) LogAdd(context *gin.Context) {
	logData := model.Log{}
	context.BindJSON(&logData)
	logs, err := service.LogServices.LogAdd(logData, context)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{
			"code":    http.StatusInternalServerError,
			"message": err.Error(),
		})
		return
	}

	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "添加成功！",
		"data":    logs,
	})
}
