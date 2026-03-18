package router

import (
	"github.com/gin-gonic/gin"
	"hamlog/app/controllers"
	"hamlog/app/middleware"
)

func QSLRouter(r *gin.Engine) {
	qslController := &controllers.QSLController{}
	qslGroup := r.Group("/api/v1/qsl")
	qslGroup.Use(middleware.JWTAuth())
	{
		// 获取所有日志
		qslGroup.GET("", qslController.QSLList)
		// 新增一条日志
		qslGroup.POST("upload", qslController.QSLUpload)
		// 删除一条日志
		qslGroup.DELETE("delete", qslController.QSLDelete)
	}
}
