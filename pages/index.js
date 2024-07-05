import Head from 'next/head'
import styles from '../styles/Home.module.css'
import { Button, Form, Grid, Header, Message, Segment } from 'semantic-ui-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [rmn, setRmn] = useState("");
  const [sid, setSid] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");
  const [theUser, setUser] = useState(null);
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setError] = useState("");
  const [dynamicUrl, setDynamicUrl] = useState("");
  const [loginType, setLoginType] = useState("OTP");
  const [pwd, setPwd] = useState("");
  const [downloading, setDownloading] = useState(false);

  const BITLY_API_TOKEN = '068dfecf9be53747723678426ca6758a0c9df94d';

  useEffect(() => {
    let tok = localStorage.getItem("token");
    let userd = localStorage.getItem("userDetails");

    if (tok !== null && userd !== null) {
      setToken(tok);
      setUser(JSON.parse(userd));
    }
  }, []);

  useEffect(() => {
    if (theUser !== null) {
      const url = `${window.location.origin.replace('localhost', '127.0.0.1')}/api/getM3u?sid=${encodeURIComponent(theUser.sid)}_A&id=${encodeURIComponent(theUser.id)}&sname=${encodeURIComponent(theUser.sName)}&tkn=${encodeURIComponent(token)}`;

      fetch('https://api-ssl.bitly.com/v4/shorten', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BITLY_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ long_url: url })
      })
        .then(response => {
          if (!response.ok) {
            throw new Error(`Network response was not ok: ${response.status} - ${response.statusText}`);
          }
          return response.json();
        })
        .then(result => {
          console.log('Bitly Short URL result:', result); // Add logging for debugging
          if (result && result.link) {
            setDynamicUrl(result.link);
          } else {
            console.error("Shorten URL not found in response data.");
          }
        })
        .catch(error => console.error('Error fetching shortened URL:', error));
    }
  }, [theUser, token]);

  const getOTP = () => {
    setLoading(true);
    fetch(`/api/getOtp?rmn=${rmn}`)
      .then(response => response.json())
      .then(res => {
        setLoading(false);
        if (res.message.toLowerCase().includes("otp") && res.message.toLowerCase().includes("successfully")) {
          setOtpSent(true);
          setError("");
        } else {
          setError(res.message);
        }
      })
      .catch(error => {
        console.log('error', error);
        setError(error.toString());
        setLoading(false);
      });
  }

  const authenticateUser = () => {
    setLoading(true);
    fetch(`/api/getAuthToken?sid=${sid}&loginType=${loginType}&otp=${otp}&pwd=${pwd}&rmn=${rmn}`)
      .then(response => response.json())
      .then(res => {
        if (res.code === 0) {
          let userDetails = res.data.userDetails;
          userDetails.id = res.data.userProfile.id;
          let token = res.data.accessToken;
          userDetails.acStatus = "ACTIVE";
          setUser(userDetails);
          setToken(token);
          localStorage.setItem("userDetails", JSON.stringify(userDetails));
          localStorage.setItem("token", token);
          setError("");
        } else {
          setError(res.message);
        }
        setLoading(false);
      })
      .catch(error => {
        console.log('error', error);
        setError(error.toString());
        setLoading(false);
      });
  }

  const logout = () => {
    localStorage.clear();
    setRmn("");
    setSid("");
    setOtpSent(false);
    setOtp("");
    setPwd("");
    setUser(null);
    setToken("");
    setLoading(false);
  }

  const downloadM3uFile = (filename) => {
    setDownloading(true);
    fetch(`${window.location.origin}/api/getM3u?sid=${theUser.sid}_A&id=${theUser.id}&sname=${theUser.sName}&tkn=${token}`)
      .then(response => response.text())
      .then(result => {
        const blob = new Blob([result], { type: 'text/plain' });
        const elem = window.document.createElement('a');
        elem.href = window.URL.createObjectURL(blob);
        elem.download = filename;
        document.body.appendChild(elem);
        elem.click();
        document.body.removeChild(elem);
        setDownloading(false);
      })
      .catch(error => {
        console.log('error', error);
        setDownloading(false);
      });
  }

  return (
    <div>
      <Head>
        <title>TATAPLAY M3U</title>
        <meta name="description" content="You can use this tool to generate a Tata Play IPTV (m3u) playlist that includes all channels." />
      </Head>
      <Grid columns='equal' padded centered>
        {token === "" || theUser === null ?
          <Grid.Row>
            <Grid.Column></Grid.Column>
            <Grid.Column computer={8} tablet={12} mobile={16}>
              <Segment loading={loading}>
                <img src="https://upload.wikimedia.org/wikipedia/commons/2/29/Tata_Play_2022_logo.svg" width="300" height="60" alt="TATA SKY LOGO" />
                <Header as={'p'}>🙋 Hey there! Create your own Tataplay playlist here.</Header>
                <p>🎉 Please log in using your TataPlay account to start enjoying the services.</p>
                <Form>
                  {loginType === 'OTP' ?
                    <>
                      <Form.Field disabled={otpSent}>
                        <label>RMN</label>
                        <input value={rmn} placeholder='Registered Mobile Number' onChange={(e) => setRmn(e.currentTarget.value)} />
                      </Form.Field>
                      <Form.Field disabled={otpSent}>
                        <label>Subscriber ID</label>
                        <input value={sid} placeholder='Subscriber ID' onChange={(e) => setSid(e.currentTarget.value)} />
                      </Form.Field>
                      <Form.Field disabled={!otpSent}>
                        <label>OTP</label>
                        <input value={otp} placeholder='OTP' onChange={(e) => setOtp(e.currentTarget.value)} />
                      </Form.Field>
                      {otpSent ? <Button primary onClick={authenticateUser}>Login</Button> : <Button primary onClick={getOTP}>Get OTP</Button>}
                    </> :
                    <>
                      <Form.Field>
                        <label>Subscriber ID</label>
                        <input value={sid} placeholder='Subscriber ID' onChange={(e) => setSid(e.currentTarget.value)} />
                      </Form.Field>
                      <Form.Field>
                        <label>Password</label>
                        <input type='password' value={pwd} placeholder='Password' onChange={(e) => setPwd(e.currentTarget.value)} />
                      </Form.Field>
                      <Button primary onClick={authenticateUser}>Login</Button>
                    </>
                  }
                </Form>
              </Segment>
            </Grid.Column>
            <Grid.Column></Grid.Column>
          </Grid.Row> :
          <Grid.Row>
            <Grid.Column></Grid.Column>
            <Grid.Column computer={8} tablet={12} mobile={16}>
              <Segment loading={loading}>
                <Header as="h1">Welcome, {theUser.sName}</Header>
                <Message>
                  <Message.Header>Dynamic URL to get m3u:</Message.Header>
                  <p><a href={dynamicUrl}>{dynamicUrl}</a></p>
                  <p>You can use the provided m3u URL to watch all Tata Play channels on OTT Navigator or Tivimate app.</p>
                  <p>You cannot generate a permanent m3u file URL on localhost. However, you can download your m3u file.</p>
                  <p><Button loading={downloading} primary onClick={() => downloadM3uFile('playlist.m3u')}>Download m3u file</Button></p>
                  <p>The downloaded m3u file will only be valid for 24 hours.</p>
                  <Message.Header>Note: Use this playlist on OTT Navigator and set it to reload data every 10 minutes because HMAC expires every 10 minutes for most channels.</Message.Header>
                </Message>
                <Button negative onClick={logout}>Logout</Button>
              </Segment>
            </Grid.Column>
            <Grid.Column></Grid.Column>
          </Grid.Row>
        }
        {err && (
          <Grid.Row>
            <Grid.Column></Grid.Column>
             <Grid.Column computer={8} tablet={12} mobile={16}>
              <Message negative>
                <Message.Header>Error</Message.Header>
                <p>{err}</p>
              </Message>
            </Grid.Column>
            <Grid.Column></Grid.Column>
          </Grid.Row>
        )}
        <Grid.Row>
          <Grid.Column></Grid.Column>
          <Grid.Column textAlign='center' computer={8} tablet={12} mobile={16}>
            <a href="https://cheapgeeky.com" target="_blank" rel="noreferrer">Visit CheapGeeky</a>
            <p>Made with ♥️ by Ankush.</p>
          </Grid.Column>
          <Grid.Column></Grid.Column>
        </Grid.Row>
      </Grid>
    </div>
  );
}
