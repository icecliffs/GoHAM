package router

import (
	"github.com/gin-gonic/gin"
	"hamlog/app/controllers"
	"hamlog/app/middleware"
)

func LogRouter(r *gin.Engine) {
	logController := &controllers.LogController{}
	logGroup := r.Group("/api/v1/")
	logGroup.Use(middleware.JWTAuth())
	{
		// 获取所有日志
		logGroup.GET("log", logController.LogList)
		// 新增一条日志
		logGroup.POST("log/add", logController.LogAdd)
		// 删除一条日志
		logGroup.DELETE("log/delete", logController.LogDelete)
		// 修改一条日志
		logGroup.PUT("log/change", logController.LogEdit)
		// 导出日志
		logGroup.GET("log/output", logController.LogOutput)
		// 导入日志
		logGroup.POST("log/input", logController.LogInput)
	}
}
