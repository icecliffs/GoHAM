package controllers

import (
	"github.com/gin-gonic/gin"
	"hamlog/app/model"
	"hamlog/app/service"
	"net/http"
)

type FrequencyController struct {
	frequencyService service.FrequencyInterface
}

// 列出所有频率
func (uc *FrequencyController) FrequencyList(context *gin.Context) {
	frequensys, err := service.FrequencyServices.FrequencyList(context)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	context.JSON(http.StatusOK, gin.H{
		"code": http.StatusOK,
		"data": frequensys,
	})
}

// 删除一条频率
func (uc *FrequencyController) FrequencyDelete(context *gin.Context) {
	frequencyId := context.Query("id")
	frequencys, err := service.FrequencyServices.FrequencyDelete(frequencyId)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "删除成功！",
		"data":    frequencys,
	})
}

// 添加一条频率
func (uc *FrequencyController) FrequencyAdd(context *gin.Context) {
	frequencyData := model.Frequency{}
	context.BindJSON(&frequencyData)
	frequencys, err := service.FrequencyServices.FrequencyAdd(frequencyData, context)
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
		"data":    frequencys,
	})
}

// 编辑一条频率
func (uc *FrequencyController) FrequencyEdit(context *gin.Context) {
	frequencyId := context.Query("id")
	frequencyData := model.Frequency{}
	context.BindJSON(&frequencyData)
	logs, err := service.FrequencyServices.FrequencyEdit(frequencyData, frequencyId)
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
