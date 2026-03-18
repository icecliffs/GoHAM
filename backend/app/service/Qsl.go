package service

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"hamlog/app/config/yaml"
	"hamlog/app/model"
)

// QSL卡片
type QSL struct {
	ID         int `json:"id"`
	Url        int `json:"url"`
	Name       int `json:"name"`
	UploadTime int `json:"uploadtime"`
}

type QSLInterface interface {
	QSLList(context *gin.Context)
	QSLUpload(qsl model.QSL)
	QSLDelete(qslId string)
}

type QSLService struct {
}

func (u *QSLService) QSLDelete(qslId string) error {
	DB, err := yaml.GetDatabase()
	if err != nil {
		return fmt.Errorf("数据库连接失败: %v", err)
	}

	query := "DELETE FROM user_qsl WHERE id = ?"
	result, err := DB.Exec(query, qslId)
	if err != nil {
		return fmt.Errorf("删除QSL卡信息失败: %v", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("无法获取影响的行数: %v", err)
	}
	if rowsAffected == 0 {
		return fmt.Errorf("未找到要删除的记录，ID: %s", qslId)
	}

	return nil
}

func (u *QSLService) QSLList(context *gin.Context) ([]model.QSL, error) {
	userId := context.GetInt("user_id")

	DB, err := yaml.GetDatabase()
	if err != nil {
		return nil, fmt.Errorf("数据库连接失败: %v", err)
	}

	fmt.Printf("test: %d\n", userId)

	query := "SELECT id, file_name, user_id, upload_time FROM user_qsl WHERE user_id = ?;"
	rows, err := DB.Query(query, userId)
	if err != nil {
		return nil, fmt.Errorf("查询失败: %v", err)
	}
	defer rows.Close()

	var qslList []model.QSL
	for rows.Next() {
		var qsl model.QSL
		err := rows.Scan(&qsl.Id, &qsl.FileName, &qsl.UserId, &qsl.UploadTime)
		if err != nil {
			return nil, fmt.Errorf("解析数据失败: %v", err)
		}
		qsl.Url = "/upload/" + qsl.FileName
		qslList = append(qslList, qsl)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历数据时出错: %v", err)
	}

	return qslList, nil
}

func (u *QSLService) UpdateUserQSL(userID int, qslFileName string) error {
	DB, _ := yaml.GetDatabase()
	query := "INSERT INTO user_qsl (user_id, file_name) VALUES (?, ?)"
	_, err := DB.Exec(query, userID, qslFileName)
	if err != nil {
		return fmt.Errorf("更新QSL卡信息失败: %v", err)
	}
	return nil
}
