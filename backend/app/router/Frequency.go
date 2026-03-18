package router

import (
	"github.com/gin-gonic/gin"
	"hamlog/app/controllers"
	"hamlog/app/middleware"
)

func FrequencyRouter(r *gin.Engine) {
	frequencyController := &controllers.FrequencyController{}
	frequencyGroup := r.Group("/api/v1")
	frequencyGroup.Use(middleware.JWTAuth())
	{
		// 获取所有频率
		frequencyGroup.GET("frequency", frequencyController.FrequencyList)
		// 新增一条频率
		frequencyGroup.POST("frequency/add", frequencyController.FrequencyAdd)
		// 删除一条频率
		frequencyGroup.DELETE("frequency/delete", frequencyController.FrequencyDelete)
		// 修改一条频率
		frequencyGroup.PUT("frequency/change", frequencyController.FrequencyEdit)
	}
}
