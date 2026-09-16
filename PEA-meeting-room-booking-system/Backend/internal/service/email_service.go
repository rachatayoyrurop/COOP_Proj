package service

import (
	"crypto/tls"
	"fmt"
	"log"
	"net/smtp"
	"strings"

	"pea-room-booking/internal/config"
	"pea-room-booking/internal/model"
)

type EmailService interface {
	SendNewBookingAlert(booking *model.Booking, creator *model.User, roomName string)
	SendBookingStatusUpdate(booking *model.Booking, user *model.User, roomName string, action string, remark string)
}

type emailService struct {
	cfg *config.Config
}

func NewEmailService(cfg *config.Config) EmailService {
	return &emailService{cfg: cfg}
}

func (s *emailService) sendMail(to []string, subject, body string) error {
	if s.cfg.SMTPHost == "" {
		log.Printf("SMTP host not configured. Skipping email dispatch (Subject: %s, To: %s)", subject, strings.Join(to, ", "))
		return nil
	}

	// Prepare mail headers & body
	mime := "MIME-version: 1.0;\nContent-Type: text/html; charset=\"UTF-8\";\n\n"
	fromHeader := fmt.Sprintf("From: %s\n", s.cfg.SMTPSender)
	toHeader := fmt.Sprintf("To: %s\n", strings.Join(to, ", "))
	subjectHeader := fmt.Sprintf("Subject: %s\n", subject)
	msg := []byte(fromHeader + toHeader + subjectHeader + mime + body)

	addr := fmt.Sprintf("%s:%s", s.cfg.SMTPHost, s.cfg.SMTPPort)

	// Port 465 requires implicit SSL/TLS dialer
	if s.cfg.SMTPPort == "465" {
		tlsConfig := &tls.Config{
			InsecureSkipVerify: true,
			ServerName:         s.cfg.SMTPHost,
		}

		conn, err := tls.Dial("tcp", addr, tlsConfig)
		if err != nil {
			log.Printf("SMTP Port 465 SSL TLS Dial failed: %v", err)
			return err
		}
		defer conn.Close()

		c, err := smtp.NewClient(conn, s.cfg.SMTPHost)
		if err != nil {
			log.Printf("SMTP Client creation failed: %v", err)
			return err
		}
		defer c.Close()

		if s.cfg.SMTPUser != "" && s.cfg.SMTPPass != "" {
			auth := smtp.PlainAuth("", s.cfg.SMTPUser, s.cfg.SMTPPass, s.cfg.SMTPHost)
			if err = c.Auth(auth); err != nil {
				log.Printf("SMTP Auth on Port 465 failed: %v", err)
				return err
			}
		}

		if err = c.Mail(s.cfg.SMTPUser); err != nil {
			return err
		}
		for _, rcpt := range to {
			if err = c.Rcpt(rcpt); err != nil {
				return err
			}
		}

		w, err := c.Data()
		if err != nil {
			return err
		}
		_, err = w.Write(msg)
		if err != nil {
			return err
		}
		err = w.Close()
		if err != nil {
			return err
		}

		log.Printf("Email successfully sent via Port 465 (SSL) to %s", strings.Join(to, ", "))
		return c.Quit()
	}

	// Default standard SMTP ports (like 587) using STARTTLS automatically
	var auth smtp.Auth
	if s.cfg.SMTPUser != "" && s.cfg.SMTPPass != "" {
		auth = smtp.PlainAuth("", s.cfg.SMTPUser, s.cfg.SMTPPass, s.cfg.SMTPHost)
	}

	err := smtp.SendMail(addr, auth, s.cfg.SMTPUser, to, msg)
	if err != nil {
		log.Printf("SMTP SendMail failed on port %s: %v", s.cfg.SMTPPort, err)
		return err
	}

	log.Printf("Email successfully sent to %s (Subject: %s)", strings.Join(to, ", "), subject)
	return nil
}

func (s *emailService) SendNewBookingAlert(booking *model.Booking, creator *model.User, roomName string) {
	// 1. Send confirmation email to the user
	if creator.Email != "" {
		subject := fmt.Sprintf("ยืนยันการรับคำขอจองห้องประชุม PEA (รหัสการจอง: %s)", booking.BookingCode)
		body := fmt.Sprintf(`
			<html>
			<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
				<div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
					<h2 style="color: #8E24AA; margin-top: 0;">การไฟฟ้าส่วนภูมิภาค (PEA)</h2>
					<h3 style="color: #444; border-bottom: 2px solid #8E24AA; padding-bottom: 8px;">ระบบได้รับคำขอจองห้องประชุมของคุณเรียบร้อยแล้ว</h3>
					<p>สวัสดีคุณ <strong>%s</strong>,</p>
					<p>ระบบจองห้องประชุมออนไลน์ได้รับรายละเอียดคำขอจองห้องของคุณและกำลังรอแอดมินพิจารณาอนุมัติ โดยมีรายละเอียดดังนี้:</p>
					<table style="width: 100%%; border-collapse: collapse; margin: 20px 0;">
						<tr>
							<td style="padding: 8px 0; font-weight: bold; width: 140px; color: #666;">รหัสการจอง:</td>
							<td style="padding: 8px 0; font-weight: bold; color: #8E24AA;">%s</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #666;">หัวเรื่องการประชุม:</td>
							<td style="padding: 8px 0;">%s</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #666;">ห้องประชุม:</td>
							<td style="padding: 8px 0;">%s</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #666;">วันเวลาประชุม:</td>
							<td style="padding: 8px 0;">%s - %s น.</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #666;">จำนวนผู้ร่วม:</td>
							<td style="padding: 8px 0;">%d คน</td>
						</tr>
						<tr>
							<td style="padding: 8px 0; color: #666;">สถานะ:</td>
							<td style="padding: 8px 0;"><span style="background-color: #FFFDE7; color: #F57F17; font-weight: bold; padding: 4px 10px; border-radius: 6px; font-size: 0.9em;">รอดำเนินการอนุมัติ</span></td>
						</tr>
					</table>
					<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
					<p style="font-size: 0.85em; color: #999; text-align: center; margin-bottom: 0;">
						นี่คือการแจ้งเตือนอัตโนมัติจากระบบจองห้องประชุม PEA กรุณาอย่าตอบกลับอีเมลนี้
					</p>
				</div>
			</body>
			</html>
		`, creator.FullName, booking.BookingCode, booking.Title, roomName, booking.StartDate.Format("02/01/2006 15:04"), booking.EndDate.Format("15:04"), booking.ParticipantCount)
		
		go s.sendMail([]string{creator.Email}, subject, body)
	}
}

func (s *emailService) SendBookingStatusUpdate(booking *model.Booking, user *model.User, roomName string, action string, remark string) {
	if user.Email == "" {
		return
	}

	var statusLabel string
	var statusColor string
	var statusBg string
	var introText string

	if action == "Approve" {
		statusLabel = "อนุมัติเรียบร้อยแล้ว"
		statusColor = "#2E7D32"
		statusBg = "#E8F5E9"
		introText = "ยินดีด้วย! คำขอจองห้องประชุมของคุณได้รับการอนุมัติเรียบร้อยแล้ว คุณสามารถเข้าใช้งานห้องประชุมได้ตามวันเวลาดังกล่าว"
	} else if action == "Reject" {
		statusLabel = "ปฏิเสธคำขอจอง"
		statusColor = "#C62828"
		statusBg = "#FFEBEE"
		introText = "ขออภัยด้วยครับ คำขอจองห้องประชุมของคุณไม่ได้รับการอนุมัติโดยมีเหตุผลชี้แจงจากผู้อนุมัติระบบ"
	} else {
		return
	}

	subject := fmt.Sprintf("แจ้งผลการพิจารณาคำขอจองห้องประชุม PEA (รหัสการจอง: %s)", booking.BookingCode)
	remarkHtml := ""
	if remark != "" {
		remarkHtml = fmt.Sprintf(`
			<div style="background-color: #f9f9f9; border-left: 4px solid %s; padding: 12px; margin: 20px 0; border-radius: 4px;">
				<strong style="color: #555;">เหตุผลชี้แจง / หมายเหตุ:</strong>
				<p style="margin: 6px 0 0 0; color: #333;">%s</p>
			</div>
		`, statusColor, remark)
	}

	body := fmt.Sprintf(`
		<html>
		<body style="font-family: sans-serif; line-height: 1.6; color: #333;">
			<div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 12px; padding: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);">
				<h2 style="color: #8E24AA; margin-top: 0;">การไฟฟ้าส่วนภูมิภาค (PEA)</h2>
				<h3 style="color: #444; border-bottom: 2px solid #8E24AA; padding-bottom: 8px;">แจ้งผลการจองห้องประชุม</h3>
				<p>สวัสดีคุณ <strong>%s</strong>,</p>
				<p>%s</p>
				<table style="width: 100%%; border-collapse: collapse; margin: 20px 0;">
					<tr>
						<td style="padding: 8px 0; font-weight: bold; width: 140px; color: #666;">รหัสการจอง:</td>
						<td style="padding: 8px 0; font-weight: bold; color: #8E24AA;">%s</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #666;">หัวเรื่องการประชุม:</td>
						<td style="padding: 8px 0;">%s</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #666;">ห้องประชุม:</td>
						<td style="padding: 8px 0;">%s</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #666;">วันเวลาประชุม:</td>
						<td style="padding: 8px 0;">%s - %s น.</td>
					</tr>
					<tr>
						<td style="padding: 8px 0; color: #666;">ผลการพิจารณา:</td>
						<td style="padding: 8px 0;"><span style="background-color: %s; color: %s; font-weight: bold; padding: 4px 10px; border-radius: 6px; font-size: 0.9em;">%s</span></td>
					</tr>
				</table>
				%s
				<hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
				<p style="font-size: 0.85em; color: #999; text-align: center; margin-bottom: 0;">
					นี่คือการแจ้งเตือนอัตโนมัติจากระบบจองห้องประชุม PEA กรุณาอย่าตอบกลับอีเมลนี้
				</p>
			</div>
		</body>
		</html>
	`, user.FullName, introText, booking.BookingCode, booking.Title, roomName, booking.StartDate.Format("02/01/2006 15:04"), booking.EndDate.Format("15:04"), statusBg, statusColor, statusLabel, remarkHtml)

	go s.sendMail([]string{user.Email}, subject, body)
}
