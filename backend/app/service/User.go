package service

import (
	"fmt"
	"github.com/pquerna/otp/totp"
	"hamlog/app/config/yaml"
	"hamlog/app/model"
	"hamlog/app/utils"
	"time"
)

type User struct {
	ID             int    `json:"id"`
	Username       string `json:"username"`
	Opt            string `json:"otp"`
	Email          string `json:"email"`
	CallSign       string `json:"callsign"`
	StationAddress string `json:"stationaddress"`
	Name           string `json:"name"`
	Address        string `json:"address"`
	City           string `json:"city"`
	Province       string `json:"province"`
	Code           string `json:"code"`
	Country        string `json:"country"`
	Avatar         string `json:"avatar"`
	Device         string `json:"device"`
	Antenna        string `json:"antenna"`
	Power          string `json:"power"`
	Gird           string `json:"gird"`
	CQZone         string `json:"cqzone"`
	ITUZone        string `json:"ituzone"`
}

type UserInterface interface {
	// 获取当前用户信息
	UserList()
	UserChangeQSLCard1(qsl1 string)
	UserChangeQSLCard2(qsl2 string)
	// 用户登录
	UserLogin(username, otp string)
	// 用户修改
	UserChange(user User, userId string)
}

type UserService struct {
}

// 用户详情编辑
func (u *UserService) UserChange(user User, userId string) (string, error) {
	DB, _ := yaml.GetDatabase()
	query := "UPDATE user SET email = ?, callsign = ?, stationaddress = ?, name = ?, address = ?, city = ?, province = ?, code = ?, country = ?, device = ?, antenna = ?, power = ?, gird = ?, cqzone = ?, ituzone = ? WHERE id = ?;"
	_, err := DB.Exec(query, user.Email, user.CallSign, user.StationAddress, user.Name, user.Address, user.City, user.Province, user.Code, user.Country, user.Device, user.Antenna, user.Power, user.Gird, user.CQZone, user.ITUZone, userId)
	if err != nil {
		return "用户编辑失败！", fmt.Errorf("错误信息 %v", err)
	}
	return "ok", nil
}

// 删除一个用户
func (u *UserService) UserDelete(userId string) (string, error) {
	DB, _ := yaml.GetDatabase()
	sql := `DELETE FROM user WHERE id = ?`
	logSql := `DELETE FROM log WHERE user_id = ?`
	_, _ = DB.Exec(sql, userId)
	_, _ = DB.Exec(logSql, userId)
	return "ok", nil
}

// 更新一个用户
func (u *UserService) UserUpdate(userId, username, callsign, email, otp string) (string, error) {
	DB, err := yaml.GetDatabase()
	if err != nil {
		return "", fmt.Errorf("数据库连接失败: %v", err)
	}
	sql := `
		UPDATE user SET 
			username = ?, 
			callsign = ?, 
			email = ?, 
			otp = ? 
		WHERE id = ?
	`
	_, _ = DB.Exec(sql, username, callsign, email, otp, userId)
	return "ok", nil
}

func (u *UserService) UserLog(userId string) ([]model.Log, error) {
	DB, _ := yaml.GetDatabase()
	rows, _ := DB.Query(`
		SELECT id, date, endate, tosign, fromsign, frequency, band, method,
		       tosignal, fromsignal, topower, frompower, toantenna, fromantenna,
		       todevice, fromdevice, toqth, fromqth, duration, content,
		       country, fromcountry, user_id
		FROM log WHERE user_id = ?
	`, userId)

	defer rows.Close()

	var logs []model.Log
	for rows.Next() {
		var log model.Log
		err := rows.Scan(
			&log.ID, &log.Date, &log.EnDate, &log.ToSign, &log.FromSign,
			&log.Frequency, &log.Band, &log.Method, &log.ToSignal, &log.FromSignal,
			&log.ToPower, &log.FromPower, &log.ToAntenna, &log.FromAntenna,
			&log.ToDevice, &log.FromDevice, &log.ToQTH, &log.FromQTH,
			&log.Duration, &log.Content, &log.Country, &log.FromCountry, &log.UserId,
		)
		if err != nil {
			return nil, err
		}

		// 解密敏感字段
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
					return nil, fmt.Errorf("%s解密失败: %v", f.name, err)
				}
				*f.field = decrypted
			}
		}

		logs = append(logs, log)
	}

	return logs, nil
}

// 展示用户信息
func (u *UserService) UserList() ([]*User, error) {
	DB, _ := yaml.GetDatabase()
	rows, err := DB.Query("SELECT id,email,username,otp,callsign,stationaddress,name,address,city,province,code,country,avatar,device,antenna,power,gird,cqzone,ituzone FROM user")
	if err != nil {
		return nil, fmt.Errorf("数据库查询失败: %v", err)
	}
	defer rows.Close()

	var users []*User
	for rows.Next() {
		var user User
		err := rows.Scan(
			&user.ID,
			&user.Email,
			&user.Username,
			&user.Opt,
			&user.CallSign,
			&user.StationAddress,
			&user.Name,
			&user.Address,
			&user.City,
			&user.Province,
			&user.Code,
			&user.Country,
			&user.Avatar,
			&user.Device,
			&user.Antenna,
			&user.Power,
			&user.Gird,
			&user.CQZone,
			&user.ITUZone,
		)
		if err != nil {
			return nil, fmt.Errorf("读取数据库行失败: %v", err)
		}
		users = append(users, &user)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("遍历数据库行时出错: %v", err)
	}

	return users, nil
}

// UserLogin authenticates a user using username and OTP
func (u *UserService) UserLogin(username, otp string) (*User, error) {
	DB, _ := yaml.GetDatabase()
	// 查询用户的OTP信息
	query := "SELECT id, username, otp, email, callsign, stationaddress, name, address, city, province, code, country, avatar, device, antenna, power, gird, cqzone, ituzone FROM user WHERE username = ?"
	row := DB.QueryRow(query, username)
	var user User
	err := row.Scan(
		&user.ID,
		&user.Username,
		&user.Opt,
		&user.Email,
		&user.CallSign,
		&user.StationAddress,
		&user.Name,
		&user.Address,
		&user.City,
		&user.Province,
		&user.Code,
		&user.Country,
		&user.Avatar,
		&user.Device,
		&user.Antenna,
		&user.Power,
		&user.Gird,
		&user.CQZone,
		&user.ITUZone,
	)
	if err != nil {
		return nil, fmt.Errorf("用户不存在或数据库错误: %v", err)
	}
	// 验证OTP
	code, err := totp.GenerateCode(user.Opt, time.Now())
	if err != nil {
		panic(err)
	}
	fmt.Printf("当前用户：%s; 所使代码：%s", username, code)
	if code == otp {
		return &user, nil
	} else {
		return nil, fmt.Errorf("OTP验证码错误")
	}
}

// GetUserByID 根据用户ID获取用户信息
func (u *UserService) GetUserByID(userID int) (*User, error) {
	DB, _ := yaml.GetDatabase()
	query := "SELECT id, username, email, callsign, stationaddress, name, address, city, province, code, country, avatar, device, antenna, power, gird, cqzone, ituzone FROM user WHERE id = ?"
	row := DB.QueryRow(query, userID)

	var user User
	err := row.Scan(
		&user.ID,
		&user.Username,
		&user.Email,
		&user.CallSign,
		&user.StationAddress,
		&user.Name,
		&user.Address,
		&user.City,
		&user.Province,
		&user.Code,
		&user.Country,
		&user.Avatar,
		&user.Device,
		&user.Antenna,
		&user.Power,
		&user.Gird,
		&user.CQZone,
		&user.ITUZone,
	)
	if err != nil {
		return nil, fmt.Errorf("获取用户信息失败: %v", err)
	}

	return &user, nil
}

// GetUserQSLs 获取用户的所有QSL卡
func (u *UserService) GetUserQSLs(userID int) ([]string, error) {
	DB, _ := yaml.GetDatabase()
	query := "SELECT file_name FROM user_qsl WHERE user_id = ? ORDER BY upload_time DESC"
	rows, err := DB.Query(query, userID)
	if err != nil {
		return nil, fmt.Errorf("获取QSL卡信息失败: %v", err)
	}
	defer rows.Close()

	var qslFiles []string
	for rows.Next() {
		var fileName string
		err := rows.Scan(&fileName)
		if err != nil {
			return nil, fmt.Errorf("读取QSL卡信息失败: %v", err)
		}
		qslFiles = append(qslFiles, fileName)
	}
	return qslFiles, nil
}

// 用户注册生成OTP
func (u *UserService) GetOTPCode(email string) (string, error) {
	key, err := totp.Generate(totp.GenerateOpts{
		Issuer:      "GoHAM",
		AccountName: email,
	})
	if err != nil {
		panic(err)
	}
	return key.Secret(), nil
}

// 用户发起注册
func (u *UserService) UserRegister(
	username string,
	email string,
	callsign string,
	otp string,
) (string, error) {
	DB, err := yaml.GetDatabase()
	if err != nil {
		return "", fmt.Errorf("数据库连接失败: %v", err)
	}
	var exists int
	checkQuery := "SELECT COUNT(*) FROM user WHERE email = ?"
	err = DB.QueryRow(checkQuery, email).Scan(&exists)
	if err != nil {
		return "", fmt.Errorf("邮箱查重失败: %v", err)
	}
	if exists > 0 {
		return "", fmt.Errorf("该邮箱已注册")
	}
	insertQuery := `
	INSERT INTO user (
		username, email, callsign, otp,
		stationaddress, name, address, city,
		province, code, country, avatar,
		device, antenna, power, gird,
		cqzone, ituzone
	) VALUES (
		?, ?, ?, ?,
		'1', '1', '1', '1',
		'1', '1', '1', '1',
		'1', '1', '1', '1',
		'1', '1'
	)
	`
	_, err = DB.Exec(insertQuery, username, email, callsign, otp)
	if err != nil {
		return "", fmt.Errorf("注册失败: %v", err)
	}
	return "注册成功", nil
}
