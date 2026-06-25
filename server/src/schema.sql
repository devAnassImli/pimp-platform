-- Schéma de la plateforme PIMP
-- Exécuté automatiquement au démarrage si DB_DRIVER=sqlserver

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'produit')
BEGIN
    CREATE TABLE produit (
        id_produit   INT IDENTITY(1,1) PRIMARY KEY,
        ean          VARCHAR(20)    NULL,
        nom_produit  NVARCHAR(255)  NOT NULL,
        marque       NVARCHAR(120)  NULL,
        fabricant    NVARCHAR(200)  NULL,
        categorie    NVARCHAR(100)  NULL,
        contenance   NVARCHAR(60)   NULL,
        pays_origine NVARCHAR(80)   NULL,
        description  NVARCHAR(MAX)  NULL,
        etiquette    NVARCHAR(255)  NULL,
        statut       VARCHAR(20)    NOT NULL DEFAULT 'valide',
        date_import  DATETIME2      NOT NULL DEFAULT SYSUTCDATETIME()
    );

    -- l'EAN identifie un produit : pas de doublon (mais NULL autorisé)
    CREATE UNIQUE INDEX UX_produit_ean
        ON produit(ean) WHERE ean IS NOT NULL;
END;

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'composition')
BEGIN
    CREATE TABLE composition (
        id_composition INT IDENTITY(1,1) PRIMARY KEY,
        id_produit     INT           NOT NULL,
        libelle        NVARCHAR(120) NOT NULL,
        valeur         NVARCHAR(80)  NULL,
        CONSTRAINT FK_composition_produit
            FOREIGN KEY (id_produit) REFERENCES produit(id_produit)
            ON DELETE CASCADE
    );
END;
