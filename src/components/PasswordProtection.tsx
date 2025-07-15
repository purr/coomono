import { useState, useEffect } from "react";
import styled from "styled-components";

const ProtectionContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  width: 100vw;
  position: fixed;
  top: 0;
  left: 0;
  background-color: ${({ theme }) => theme.base};
  z-index: 9999;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 300px;
  padding: 24px;
  border-radius: 8px;
  background-color: ${({ theme }) => theme.overlay};
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
`;

const Input = styled.input`
  padding: 10px;
  border-radius: 4px;
  border: 1px solid ${({ theme }) => theme.subtle};
  background-color: ${({ theme }) => theme.base};
  color: ${({ theme }) => theme.text};
`;

const Button = styled.button`
  padding: 10px;
  border-radius: 4px;
  border: none;
  background-color: ${({ theme }) => theme.pine};
  color: ${({ theme }) => theme.text};
  cursor: pointer;
  font-weight: 500;

  &:hover {
    background-color: ${({ theme }) => theme.highlightHigh};
  }
`;

const ErrorMessage = styled.p`
  color: ${({ theme }) => theme.love};
  margin: 0;
  font-size: 14px;
  text-align: center;
`;

interface PasswordProtectionProps {
  children: React.ReactNode;
}

const PasswordProtection = ({ children }: PasswordProtectionProps) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Check for existing authentication cookie on component mount
  useEffect(() => {
    const authCookie = document.cookie
      .split("; ")
      .find(row => row.startsWith("authenticated="));

    if (authCookie && authCookie.split("=")[1] === "true") {
      setIsAuthenticated(true);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (password === "p4ssw0rd") {
      // Set authentication cookie (expires in 7 days)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 7);
      document.cookie = `authenticated=true; expires=${expiryDate.toUTCString()}; path=/`;
      setIsAuthenticated(true);
    } else {
      setError("Invalid password");
    }
  };

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <ProtectionContainer>
      <Form onSubmit={handleSubmit}>
        <Input
          type="password"
          placeholder="Enter password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit">Access Site</Button>
      </Form>
    </ProtectionContainer>
  );
};

export default PasswordProtection;