import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  email: string;
  name: string;
  testDate: string;
  duration: string;
  attentiveness: number;
  impulsivity: number;
  consistency: number;
  omissionErrors: number;
  commissionErrors: number;
  responseTime: number;
  variability: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      email, 
      name, 
      testDate, 
      duration, 
      attentiveness, 
      impulsivity, 
      consistency, 
      omissionErrors, 
      commissionErrors, 
      responseTime, 
      variability 
    }: EmailRequest = await req.json();

    console.log("Sending test results email to:", email);

    // Get SMTP configuration from environment
    const smtpHost = Deno.env.get("SMTP_HOST") || "sandbox.smtp.mailtrap.io";
    const smtpPort = parseInt(Deno.env.get("SMTP_PORT") || "2525");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const smtpFrom = Deno.env.get("SMTP_FROM") || "noreply@tovatest.com";
    
    if (!smtpUser || !smtpPass) {
      throw new Error("SMTP credentials not configured");
    }

    // Create email HTML
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb;">
        <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #2563eb; margin: 0; font-size: 28px;">🧠 Hasil Tes TOVA</h1>
            <p style="color: #6b7280; margin: 10px 0 0 0;">Test of Variables of Attention</p>
          </div>
          
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">📋 Informasi Peserta</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; width: 30%;">Nama:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">${name}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Email:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">${email}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Tanggal Tes:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">${testDate}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">Durasi Tes:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #374151;">${duration}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #ecfdf5; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #065f46; margin: 0 0 15px 0; font-size: 18px;">📊 Metrik Kinerja</h2>
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
              <div style="text-align: center; padding: 15px; background-color: white; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: ${attentiveness >= 80 ? '#059669' : attentiveness >= 60 ? '#d97706' : '#dc2626'};">${attentiveness}%</div>
                <div style="color: #6b7280; font-size: 14px;">Perhatian</div>
              </div>
              <div style="text-align: center; padding: 15px; background-color: white; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: ${impulsivity >= 80 ? '#059669' : impulsivity >= 60 ? '#d97706' : '#dc2626'};">${impulsivity}%</div>
                <div style="color: #6b7280; font-size: 14px;">Kontrol Impuls</div>
              </div>
              <div style="text-align: center; padding: 15px; background-color: white; border-radius: 8px;">
                <div style="font-size: 24px; font-weight: bold; color: ${consistency >= 80 ? '#059669' : consistency >= 60 ? '#d97706' : '#dc2626'};">${consistency}%</div>
                <div style="color: #6b7280; font-size: 14px;">Konsistensi</div>
              </div>
            </div>
          </div>

          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">🔍 Data Teknis</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Omission Errors:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; text-align: right;">${omissionErrors}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Commission Errors:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; text-align: right;">${commissionErrors}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; border-bottom: 1px solid #e5e7eb;">Response Time:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; border-bottom: 1px solid #e5e7eb; text-align: right;">${responseTime} ms</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280;">RT Variability:</td>
                <td style="padding: 8px 0; font-weight: bold; color: #374151; text-align: right;">${variability} ms</td>
              </tr>
            </table>
          </div>

          <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #92400e; margin: 0 0 10px 0; font-size: 18px;">⚠️ Catatan Penting</h2>
            <p style="color: #92400e; margin: 0; line-height: 1.5;">
              Hasil ini merupakan data mentah dari tes kognitif. Untuk interpretasi yang akurat dan rekomendasi tindak lanjut, silakan konsultasikan dengan profesional kesehatan mental atau psikolog yang berkualifikasi.
            </p>
          </div>

          <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #6b7280; margin: 0; font-size: 14px;">
              Email ini dikirim secara otomatis dari sistem Tes TOVA<br>
              Jika Anda memiliki pertanyaan, silakan hubungi administrator.
            </p>
          </div>
        </div>
      </div>
    `;

    // Send email via SMTP with SSL/TLS
    const conn = await Deno.connectTls({
      hostname: smtpHost,
      port: smtpPort,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper function to read response
    const readResponse = async () => {
      const buffer = new Uint8Array(1024);
      const n = await conn.read(buffer);
      if (n === null) throw new Error("Connection closed");
      return decoder.decode(buffer.subarray(0, n));
    };

    // Helper function to send command
    const sendCommand = async (command: string) => {
      console.log(">>> " + command.trim());
      await conn.write(encoder.encode(command));
      const response = await readResponse();
      console.log("<<< " + response.trim());
      return response;
    };

    try {
      // SMTP conversation
      await readResponse(); // 220 greeting
      
      await sendCommand(`EHLO ${smtpHost}\r\n`);
      await sendCommand(`AUTH LOGIN\r\n`);
      await sendCommand(`${btoa(smtpUser)}\r\n`);
      await sendCommand(`${btoa(smtpPass)}\r\n`);
      await sendCommand(`MAIL FROM:<${smtpFrom}>\r\n`);
      await sendCommand(`RCPT TO:<${email}>\r\n`);
      await sendCommand(`RCPT TO:<hendy56yogya@gmail.com>\r\n`); // CC recipient
      await sendCommand(`DATA\r\n`);
      
      // Email content
      const emailContent = [
        `From: TOVA Test <${smtpFrom}>`,
        `To: ${email}`,
        `Cc: hendy56yogya@gmail.com`,
        `Subject: Hasil Tes TOVA - ${name}`,
        `MIME-Version: 1.0`,
        `Content-Type: text/html; charset=UTF-8`,
        ``,
        emailHtml,
        `.`,
        ``
      ].join('\r\n');
      
      await sendCommand(emailContent);
      await sendCommand(`QUIT\r\n`);
      
      conn.close();
      
      console.log("Email sent successfully via SMTP to:", email);

      return new Response(JSON.stringify({ success: true, message: "Email sent" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      });
    } catch (smtpError: any) {
      console.error("SMTP error:", smtpError);
      throw new Error(`Failed to send email via SMTP: ${smtpError.message}`);
    }
  } catch (error: any) {
    console.error("Error in send-test-results function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);