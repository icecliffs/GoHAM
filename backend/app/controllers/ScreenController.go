package controllers

import (
	"github.com/gin-gonic/gin"
	"hamlog/app/service"
	"net/http"
)

type DisplayController struct {
	frequencyService service.FrequencyInterface
}

// 大屏控制层
func (uc *DisplayController) DisplayScreen(context *gin.Context) {
	screens, err := service.DisplayScreenServices.DisplayScreen(context)
	if err != nil {
		context.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	context.JSON(http.StatusOK, gin.H{
		"code":    http.StatusOK,
		"message": "数据加载成功！",
		"data":    screens,
	})
}
