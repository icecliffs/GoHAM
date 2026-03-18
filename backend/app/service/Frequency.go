package service

import (
	"fmt"
	"github.com/gin-gonic/gin"
	"hamlog/app/config/yaml"
	"hamlog/app/model"
)

type FrequencyInterface interface {
	// 获取所有频率
	FrequencyList()
	// 删除一条频率
	FrequencyDelete(frequencyId string)
}

type FrequencyService struct {
}

// 获取所有频率
func (u *FrequencyService) FrequencyList(context *gin.Context) ([]model.Frequency, error) {
	DB, _ := yaml.GetDatabase()
	userId := context.GetInt("user_id")
	fmt.Printf("Fre: %s", userId)

	rows, err := DB.Query("SELECT * FROM frequency WHERE user_id = ?", userId)
	if err != nil {
		return nil, fmt.Errorf("数据库查询失败 %v", err)
	}
	defer rows.Close()
	var frequencys []model.Frequency
	for rows.Next() {
		var frequency model.Frequency
		err := rows.Scan(
			&frequency.ID,
			&frequency.Name,
			&frequency.Notes,
			&frequency.Type,
			&frequency.Receive_Downlink,
			&frequency.Frequency_Difference,
			&frequency.Transmit_Uplink,
			&frequency.Subsone,
			&frequency.Addate,
			&frequency.UserId,
		)
		if err != nil {
			return nil, fmt.Errorf("读取数据库行失败: %v", err)
		}
		frequencys = append(frequencys, frequency)
	}
	return frequencys, nil
}

// 删除一条频率
func (u *FrequencyService) FrequencyDelete(frequencyId string) (string, error) {
	if frequencyId == "" {
		return "删除失败，参数为空！", nil
	}
	DB, _ := yaml.GetDatabase()
	query := "DELETE FROM frequency WHERE id = ?"
	_, err := DB.Exec(query, frequencyId)
	if err != nil {
		return "删除失败！", fmt.Errorf("错误信息 %v", err)
	}
	return "删除成功！", nil
}

// 编辑一条频率
func (u *FrequencyService) FrequencyEdit(frequency model.Frequency, frequencyId string) (string, error) {
	DB, _ := yaml.GetDatabase()
	query := "UPDATE frequency SET name = ?, notes = ?, type = ?, receive_downlink = ?, frequency_difference = ?, transmit_uplink = ?, subsone = ?, addate = ? WHERE id = ?;"
	_, err := DB.Exec(query, frequency.Name, frequency.Notes, frequency.Type, frequency.Receive_Downlink, frequency.Frequency_Difference, frequency.Transmit_Uplink, frequency.Subsone, frequency.Addate, frequencyId)
	if err != nil {
		return "添加失败！", fmt.Errorf("错误信息 %v", err)
	}
	return "ok", nil
}

// 添加一条频率
func (u *FrequencyService) FrequencyAdd(frequency model.Frequency, context *gin.Context) (string, error) {
	DB, _ := yaml.GetDatabase()
	userId := context.GetInt("user_id")
	query := "INSERT INTO frequency (name, notes, type, receive_downlink, frequency_difference, transmit_uplink, subsone, addate, user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)"
	_, err := DB.Exec(query, frequency.Name, frequency.Notes, frequency.Type, frequency.Receive_Downlink, frequency.Frequency_Difference, frequency.Transmit_Uplink, frequency.Subsone, frequency.Addate, userId)
	if err != nil {
		return "添加失败！", fmt.Errorf("错误信息 %v", err)
	}
	return "添加成功！", nil
}
