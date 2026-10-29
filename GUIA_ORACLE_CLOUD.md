# 🏛️ Guia Definitivo: Hospedando o Omniverso na Oracle Cloud (Always Free)

Este documento foi salvo para quando você decidir hospedar o Omniverso em uma máquina virtual gratuita com **200 GB de armazenamento** na Oracle Cloud.

---

## 📋 Vantagens do Plano Always Free
* **200 GB** de disco permanente gratuito (*Block Volume*).
* **Até 24 GB de RAM e 4 OCPUs** (Arquitetura Ampere ARM) ou 2 instâncias AMD (1 GB RAM cada).
* **10 TB/mês** de transferência de dados de saída.
* IP público dedicado e acesso `root` completo via SSH.

---

## 🚀 Passo a Passo de Implantação

### 1. Criar a Conta
1. Acesse: [https://www.oracle.com/cloud/free/](https://www.oracle.com/cloud/free/)
2. Cadastre seus dados e insira um cartão de crédito internacional (eles fazem uma cobrança teste de ~$1 USD e estornam no mesmo instante para validação humana).
3. Selecione a sua "Home Region" (recomenda-se **São Paulo - Vinhedo** se disponível, ou **US East - Ashburn**).

---

### 2. Criar a Máquina Virtual (Instância Compute)
1. No menu lateral do console Oracle, vá em: **Compute > Instances**.
2. Clique em **Create Instance**.
3. Defina um nome (ex: `servidor-omniverso`).
4. Em **Image and shape**:
   * **Imagem**: Ubuntu 22.04 ou 24.04 LTS.
   * **Shape**: 
     * Opção A: *Ampere ARM* (até 4 OCPUs e 24 GB de RAM) - *Recomendado se houver capacidade*.
     * Opção B: *VM.Standard.E2.1.Micro* (AMD 1 OCPU, 1 GB RAM) - *Sempre disponível*.
5. Em **Networking**: Escolha *Create new virtual cloud network* e certifique-se de marcar **Assign a public IPv4 address**.
6. Em **Add SSH keys**:
   * Clique em **Save private key** e baixe o arquivo `.key` no seu PC (será usado para conectar pelo terminal).
7. Em **Boot volume**: Defina o tamanho do disco (você pode colocar até **200 GB** no plano gratuito!).
8. Clique em **Create**.

---

### 3. Liberar as Portas da Web (Firewall da Oracle)
Por padrão, a Oracle bloqueia as portas de internet. Para liberar:
1. Vá na página da sua Instância e clique na sua **Subnet** (em Primary VNIC).
2. Clique na **Default Security List**.
3. Clique em **Add Ingress Rules**:
   * **Source CIDR**: `0.0.0.0/0`
   * **Destination Port Range**: `80,443`
   * **Description**: `Liberar HTTP e HTTPS`
4. Clique em **Add Ingress Rules**.

---

### 4. Conectar e Configurar o Servidor (Comandos Prontos)

Abra o PowerShell ou Terminal no seu PC (na pasta onde salvou a chave SSH) e conecte:
```bash
ssh -i sua_chave_privada.key ubuntu@SEU_IP_PUBLICO
```

Depois de conectar, copie e cole o bloco de comandos abaixo:

```bash
# 1. Atualizar o sistema
sudo apt update && sudo apt upgrade -y

# 2. Instalar Apache, PHP e MySQL
sudo apt install apache2 php libapache2-mod-php php-mysql php-gd php-curl php-mbstring php-xml mysql-server -y

# 3. Liberar portas no firewall do Linux (iptables/ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save 2>/dev/null || true

# 4. Ativar módulo de reescrita de URL do Apache (para as rotas limpas do .htaccess)
sudo a2enmod rewrite

# 5. Permitir .htaccess no Apache
sudo sed -i '/<Directory \/var\/www\/>/,/<\/Directory>/ s/AllowOverride None/AllowOverride All/' /etc/apache2/apache2.conf

# 6. Aumentar limite de upload do PHP para prints e vídeos (ex: 100MB)
sudo sed -i 's/upload_max_filesize = .*/upload_max_filesize = 100M/' /etc/php/*/apache2/php.ini
sudo sed -i 's/post_max_size = .*/post_max_size = 105M/' /etc/php/*/apache2/php.ini

# 7. Reiniciar o Apache
sudo systemctl restart apache2
```

---

### 5. Configurar o Banco de Dados MySQL

No terminal da máquina, execute:
```bash
sudo mysql
```

Dentro do MySQL, rode os comandos:
```sql
CREATE DATABASE IF NOT EXISTS omniverso CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'omniverso_user'@'localhost' IDENTIFIED BY 'SuaSenhaSegura123!';
GRANT ALL PRIVILEGES ON omniverso.* TO 'omniverso_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

---

### 6. Subir o Projeto

```bash
# Entrar na pasta do Apache
cd /var/www/html

# Limpar o arquivo index.html padrão do Apache
sudo rm -f index.html

# Clonar o seu repositório Git
sudo git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git .

# Dar permissão para o Apache gravar uploads na pasta
sudo chown -R www-data:www-data /var/www/html/uploads
sudo chmod -R 775 /var/www/html/uploads

# Configurar as credenciais do banco
# Basta editar api/config.php ou criar um arquivo de ambiente com a senha criada no passo 5
```

Pronto! Ao acessar `http://SEU_IP_PUBLICO/`, seu Omniverso estará online com todo o poder da Oracle Cloud.
